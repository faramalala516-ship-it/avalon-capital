use avalon_security::{
    derive_key, AvalonError, AvalonResult, KeyDomain, KeyStatus, SecretBytes,
};
use chrono::{DateTime, Utc};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use uuid::Uuid;

use crate::provider::RootKeyProvider;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyMetadata {
    pub key_id: String,
    pub domain: KeyDomain,
    pub created_at: DateTime<Utc>,
    pub status: KeyStatus,
    pub algorithm: String,
    pub rotation_version: u32,
}

struct KeyEntry {
    meta: KeyMetadata,
    material: SecretBytes,
}

/// In-memory key ring wrapped by root provider for persistence of root only.
pub struct KeyRing {
    provider: Arc<dyn RootKeyProvider>,
    root_sealed_path: std::path::PathBuf,
    keys: RwLock<HashMap<String, KeyEntry>>,
    root: RwLock<Option<SecretBytes>>,
}

impl KeyRing {
    pub fn open_or_create(
        provider: Arc<dyn RootKeyProvider>,
        secure_dir: &std::path::Path,
    ) -> AvalonResult<Self> {
        std::fs::create_dir_all(secure_dir)
            .map_err(|e| AvalonError::Internal(format!("secure dir: {e}")))?;
        let root_sealed_path = secure_dir.join("root.key.sealed");
        let ring = Self {
            provider,
            root_sealed_path,
            keys: RwLock::new(HashMap::new()),
            root: RwLock::new(None),
        };
        ring.ensure_root()?;
        ring.materialize_domain_keys()?;
        Ok(ring)
    }

    fn ensure_root(&self) -> AvalonResult<()> {
        if self.root_sealed_path.exists() {
            let sealed = std::fs::read(&self.root_sealed_path)
                .map_err(|e| AvalonError::VaultLocked(format!("read root: {e}")))?;
            let root = self.provider.unprotect(&sealed)?;
            *self.root.write() = Some(root);
        } else {
            let root = SecretBytes::random(32);
            let sealed = self.provider.protect(&root)?;
            std::fs::write(&self.root_sealed_path, sealed)
                .map_err(|e| AvalonError::Internal(format!("write root: {e}")))?;
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = std::fs::metadata(&self.root_sealed_path)
                    .map_err(|e| AvalonError::Internal(e.to_string()))?
                    .permissions();
                perms.set_mode(0o600);
                let _ = std::fs::set_permissions(&self.root_sealed_path, perms);
            }
            *self.root.write() = Some(root);
        }
        Ok(())
    }

    fn root(&self) -> AvalonResult<SecretBytes> {
        self.root
            .read()
            .as_ref()
            .map(|r| SecretBytes::new(r.expose().to_vec()))
            .ok_or_else(|| AvalonError::VaultLocked("root key unavailable".into()))
    }

    fn materialize_domain_keys(&self) -> AvalonResult<()> {
        let root = self.root()?;
        let salt = b"avalon-platform-v1";
        let mut map = self.keys.write();
        for domain in [
            KeyDomain::Vault,
            KeyDomain::Database,
            KeyDomain::AgentSecrets,
            KeyDomain::Audit,
            KeyDomain::Backup,
            KeyDomain::Session,
        ] {
            let key_id = format!("{}:v1", domain.as_str());
            if map.contains_key(&key_id) {
                continue;
            }
            let material = derive_key(&root, domain, salt);
            map.insert(
                key_id.clone(),
                KeyEntry {
                    meta: KeyMetadata {
                        key_id,
                        domain,
                        created_at: Utc::now(),
                        status: KeyStatus::Active,
                        algorithm: "HKDF-SHA256/AES-256-GCM".into(),
                        rotation_version: 1,
                    },
                    material,
                },
            );
        }
        Ok(())
    }

    pub fn get_active(&self, domain: KeyDomain) -> AvalonResult<(KeyMetadata, SecretBytes)> {
        let map = self.keys.read();
        let entry = map
            .values()
            .find(|e| e.meta.domain == domain && e.meta.status == KeyStatus::Active)
            .ok_or_else(|| AvalonError::VaultLocked(format!("no active key for {domain:?}")))?;
        Ok((
            entry.meta.clone(),
            SecretBytes::new(entry.material.expose().to_vec()),
        ))
    }

    pub fn list_metadata(&self) -> Vec<KeyMetadata> {
        self.keys.read().values().map(|e| e.meta.clone()).collect()
    }

    /// Rotate domain key: generate → verify → activate → deprecate old.
    pub fn rotate(&self, domain: KeyDomain) -> AvalonResult<KeyMetadata> {
        let root = self.root()?;
        let salt = Uuid::new_v4().to_string();
        let new_material = derive_key(&root, domain, salt.as_bytes());
        let mut map = self.keys.write();
        let next_version = map
            .values()
            .filter(|e| e.meta.domain == domain)
            .map(|e| e.meta.rotation_version)
            .max()
            .unwrap_or(0)
            + 1;
        for entry in map.values_mut().filter(|e| e.meta.domain == domain) {
            if entry.meta.status == KeyStatus::Active {
                entry.meta.status = KeyStatus::Deprecated;
            }
        }
        let key_id = format!("{}:v{next_version}", domain.as_str());
        let meta = KeyMetadata {
            key_id: key_id.clone(),
            domain,
            created_at: Utc::now(),
            status: KeyStatus::Active,
            algorithm: "HKDF-SHA256/AES-256-GCM".into(),
            rotation_version: next_version,
        };
        map.insert(
            key_id,
            KeyEntry {
                meta: meta.clone(),
                material: new_material,
            },
        );
        Ok(meta)
    }

    pub fn provider_name(&self) -> &'static str {
        self.provider.name()
    }
}
