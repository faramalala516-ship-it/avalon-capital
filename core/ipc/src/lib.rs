//! Internal IPC authentication — localhost is NOT implicitly trusted.

use avalon_security::{AvalonError, AvalonResult, SecretBytes};
use chrono::{DateTime, Duration, Utc};
use hmac::{Hmac, Mac};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::collections::HashMap;
use uuid::Uuid;
use zeroize::Zeroize;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceIdentity {
    pub service_id: String,
    pub process_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionToken {
    pub token_id: String,
    pub service_id: String,
    pub issued_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    /// Opaque bearer — never log this value.
    #[serde(skip_serializing)]
    pub secret: String,
}

pub struct IpcAuthenticator {
    master: SecretBytes,
    sessions: RwLock<HashMap<String, SessionToken>>,
}

impl IpcAuthenticator {
    pub fn new(session_key: SecretBytes) -> Self {
        Self {
            master: session_key,
            sessions: RwLock::new(HashMap::new()),
        }
    }

    pub fn issue(&self, identity: &ServiceIdentity, ttl_secs: i64) -> AvalonResult<SessionToken> {
        let token_id = Uuid::new_v4().to_string();
        let mut mac = HmacSha256::new_from_slice(self.master.expose())
            .map_err(|e| AvalonError::SecurityViolation(e.to_string()))?;
        mac.update(token_id.as_bytes());
        mac.update(identity.service_id.as_bytes());
        let secret = hex::encode(mac.finalize().into_bytes());
        let token = SessionToken {
            token_id: token_id.clone(),
            service_id: identity.service_id.clone(),
            issued_at: Utc::now(),
            expires_at: Utc::now() + Duration::seconds(ttl_secs),
            secret,
        };
        self.sessions.write().insert(token_id, token.clone());
        Ok(token)
    }

    pub fn validate(&self, token_id: &str, secret: &str, service_id: &str) -> AvalonResult<()> {
        let sessions = self.sessions.read();
        let token = sessions
            .get(token_id)
            .ok_or_else(|| AvalonError::PermissionDenied("unknown ipc token".into()))?;
        if token.service_id != service_id {
            return Err(AvalonError::PermissionDenied("ipc service mismatch".into()));
        }
        if token.expires_at < Utc::now() {
            return Err(AvalonError::PermissionDenied("ipc token expired".into()));
        }
        if token.secret != secret {
            return Err(AvalonError::PermissionDenied("ipc token invalid".into()));
        }
        Ok(())
    }

    pub fn revoke(&self, token_id: &str) {
        if let Some(mut t) = self.sessions.write().remove(token_id) {
            t.secret.zeroize();
        }
    }
}

impl Drop for IpcAuthenticator {
    fn drop(&mut self) {
        for (_, mut t) in self.sessions.write().drain() {
            t.secret.zeroize();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn token_roundtrip() {
        let auth = IpcAuthenticator::new(SecretBytes::random(32));
        let id = ServiceIdentity {
            service_id: "kernel".into(),
            process_name: "avalon-core".into(),
        };
        let tok = auth.issue(&id, 60).unwrap();
        auth.validate(&tok.token_id, &tok.secret, "kernel").unwrap();
        assert!(auth.validate(&tok.token_id, "wrong", "kernel").is_err());
    }
}
