//! AvalonNetworkBroker — deny-by-default egress with allowlists and offline lock.

use avalon_audit::AuditLedger;
use avalon_permissions::PermissionEngine;
use avalon_security::{AvalonError, AvalonResult, NetworkMode};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkRequest {
    pub agent_id: String,
    pub provider_id: String,
    pub method: String,
    pub path: String,
    pub parameters: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderEndpoint {
    pub provider_id: String,
    pub host: String,
    pub sync_allowed: bool,
    pub permission_id: String,
}

pub struct NetworkBroker {
    mode: RwLock<NetworkMode>,
    allowlists: RwLock<HashMap<String, HashSet<String>>>,
    providers: RwLock<HashMap<String, ProviderEndpoint>>,
    permissions: Arc<PermissionEngine>,
    audit: Arc<AuditLedger>,
}

impl NetworkBroker {
    pub fn new(permissions: Arc<PermissionEngine>, audit: Arc<AuditLedger>) -> Self {
        let broker = Self {
            mode: RwLock::new(NetworkMode::OfflineLock),
            allowlists: RwLock::new(HashMap::new()),
            providers: RwLock::new(HashMap::new()),
            permissions,
            audit,
        };
        broker.seed_macro_providers();
        broker
    }

    fn seed_macro_providers(&self) {
        let providers = [
            ("fred", "api.stlouisfed.org", "network.api.fred"),
            ("bls", "api.bls.gov", "network.api.bls"),
            ("bea", "apps.bea.gov", "network.api.fred"),
            ("eurostat", "ec.europa.eu", "network.api.fred"),
            ("ecb", "data-api.ecb.europa.eu", "network.api.fred"),
            ("worldbank", "api.worldbank.org", "network.api.fred"),
            ("oecd", "sdmx.oecd.org", "network.api.fred"),
        ];
        let mut map = self.providers.write();
        let mut allow = self.allowlists.write();
        for (id, host, perm) in providers {
            map.insert(
                id.to_string(),
                ProviderEndpoint {
                    provider_id: id.into(),
                    host: host.into(),
                    sync_allowed: true,
                    permission_id: perm.into(),
                },
            );
            allow
                .entry("macro-x".into())
                .or_default()
                .insert(host.to_string());
        }
    }

    pub fn set_mode(&self, mode: NetworkMode) {
        *self.mode.write() = mode;
        let _ = self.audit.append(
            "user",
            "network.mode.changed",
            &format!("{mode:?}"),
            "OK",
            None,
            None,
        );
    }

    pub fn mode(&self) -> NetworkMode {
        *self.mode.read()
    }

    pub fn allow_host(&self, agent_id: &str, host: &str) {
        self.allowlists
            .write()
            .entry(agent_id.to_string())
            .or_default()
            .insert(host.to_string());
    }

    pub fn authorize(&self, req: &NetworkRequest) -> AvalonResult<ProviderEndpoint> {
        let mode = self.mode();
        if mode == NetworkMode::OfflineLock {
            let _ = self.audit.append(
                &req.agent_id,
                "network.denied",
                &req.provider_id,
                "DENIED",
                None,
                Some(serde_json::json!({"reason": "OFFLINE_LOCK"})),
            );
            return Err(AvalonError::NetworkDenied("OFFLINE_LOCK active".into()));
        }

        let provider = self
            .providers
            .read()
            .get(&req.provider_id)
            .cloned()
            .ok_or_else(|| {
                let _ = self.audit.append(
                    &req.agent_id,
                    "network.denied",
                    &req.provider_id,
                    "DENIED",
                    None,
                    Some(serde_json::json!({"reason": "unknown provider"})),
                );
                AvalonError::NetworkDenied(format!("unknown provider {}", req.provider_id))
            })?;

        if mode == NetworkMode::SyncOnly && !provider.sync_allowed {
            return Err(AvalonError::NetworkDenied(
                "provider not allowed in SYNC_ONLY".into(),
            ));
        }

        // Reject arbitrary URLs / hosts not in allowlist
        if let Ok(url) = Url::parse(&req.path) {
            if let Some(host) = url.host_str() {
                if host != provider.host {
                    let _ = self.audit.append(
                        &req.agent_id,
                        "network.denied",
                        host,
                        "DENIED",
                        None,
                        Some(serde_json::json!({"reason": "host mismatch"})),
                    );
                    return Err(AvalonError::NetworkDenied(
                        "arbitrary network destination denied".into(),
                    ));
                }
            }
        }

        let allowed = self
            .allowlists
            .read()
            .get(&req.agent_id)
            .map(|s| s.contains(&provider.host))
            .unwrap_or(false);
        if !allowed {
            let _ = self.audit.append(
                &req.agent_id,
                "network.denied",
                &provider.host,
                "DENIED",
                None,
                Some(serde_json::json!({"reason": "not in allowlist"})),
            );
            return Err(AvalonError::NetworkDenied(format!(
                "host {} not allowlisted for {}",
                provider.host, req.agent_id
            )));
        }

        self.permissions
            .check(&req.agent_id, &provider.permission_id, None)?;

        let _ = self.audit.append(
            &req.agent_id,
            "network.authorized",
            &provider.host,
            "OK",
            None,
            None,
        );
        Ok(provider)
    }

    /// Execute is intentionally not performing real HTTP in unit tests without network;
    /// authorization is the security boundary. Real HTTP goes through authorize first.
    pub fn providers(&self) -> Vec<ProviderEndpoint> {
        self.providers.read().values().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn offline_lock_denies() {
        let dir = tempdir().unwrap();
        let audit = Arc::new(AuditLedger::open(dir.path().join("a.jsonl")).unwrap());
        let perms = Arc::new(PermissionEngine::new(audit.clone()));
        let broker = NetworkBroker::new(perms.clone(), audit);
        broker.set_mode(NetworkMode::OfflineLock);
        let req = NetworkRequest {
            agent_id: "macro-x".into(),
            provider_id: "fred".into(),
            method: "GET".into(),
            path: "/fred/series".into(),
            parameters: serde_json::json!({}),
        };
        assert!(broker.authorize(&req).is_err());
    }

    #[test]
    fn arbitrary_host_denied() {
        let dir = tempdir().unwrap();
        let audit = Arc::new(AuditLedger::open(dir.path().join("a.jsonl")).unwrap());
        let perms = Arc::new(PermissionEngine::new(audit.clone()));
        perms
            .grant("macro-x", "network.api.fred", None, false)
            .unwrap();
        let broker = NetworkBroker::new(perms, audit);
        broker.set_mode(NetworkMode::Online);
        let req = NetworkRequest {
            agent_id: "macro-x".into(),
            provider_id: "fred".into(),
            method: "GET".into(),
            path: "https://evil.example/steal".into(),
            parameters: serde_json::json!({}),
        };
        assert!(broker.authorize(&req).is_err());
    }
}
