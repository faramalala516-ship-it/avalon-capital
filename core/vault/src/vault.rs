use avalon_security::{
    decrypt, encrypt_with_key_id, AvalonError, AvalonResult, KeyDomain, SecretBytes,
};
use chrono::{DateTime, Utc};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use uuid::Uuid;

use crate::keys::KeyRing;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecretMeta {
    pub secret_id: String,
    pub provider: String,
    pub label: String,
    pub configured: bool,
    pub created_at: DateTime<Utc>,
    pub rotated_at: Option<DateTime<Utc>>,
}

#[derive(Serialize, Deserialize)]
struct StoredSecret {
    meta: SecretMeta,
    blob: avalon_security::AeadBlob,
}

/// Secure vault: only this type can create/read/rotate/delete secret values.
pub struct SecureVault {
    path: PathBuf,
    key_ring: Arc<KeyRing>,
    index: RwLock<HashMap<String, StoredSecret>>,
}

impl SecureVault {
    pub fn open(path: impl AsRef<Path>, key_ring: Arc<KeyRing>) -> AvalonResult<Self> {
        let path = path.as_ref().to_path_buf();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| AvalonError::Internal(format!("vault dir: {e}")))?;
        }
        let vault = Self {
            path,
            key_ring,
            index: RwLock::new(HashMap::new()),
        };
        vault.load()?;
        Ok(vault)
    }

    fn load(&self) -> AvalonResult<()> {
        if !self.path.exists() {
            return Ok(());
        }
        let raw = std::fs::read(&self.path)
            .map_err(|e| AvalonError::VaultLocked(format!("read vault: {e}")))?;
        let (meta, key) = self.key_ring.get_active(KeyDomain::Vault)?;
        let blob: avalon_security::AeadBlob = serde_json::from_slice(&raw)
            .map_err(|e| AvalonError::VaultLocked(format!("vault parse: {e}")))?;
        let pt = decrypt(&key, &blob, format!("vault:{}", meta.key_id).as_bytes())?;
        let stored: HashMap<String, StoredSecret> = serde_json::from_slice(&pt)
            .map_err(|e| AvalonError::VaultLocked(format!("vault decode: {e}")))?;
        *self.index.write() = stored;
        Ok(())
    }

    fn persist(&self) -> AvalonResult<()> {
        let (meta, key) = self.key_ring.get_active(KeyDomain::Vault)?;
        let snapshot = self.index.read();
        let pt = serde_json::to_vec(&*snapshot)
            .map_err(|e| AvalonError::Internal(e.to_string()))?;
        let blob = encrypt_with_key_id(&key, &meta.key_id, &pt, format!("vault:{}", meta.key_id).as_bytes())?;
        let encoded = serde_json::to_vec(&blob).map_err(|e| AvalonError::Internal(e.to_string()))?;
        let tmp = self.path.with_extension("tmp");
        std::fs::write(&tmp, &encoded)
            .map_err(|e| AvalonError::Internal(format!("write vault tmp: {e}")))?;
        std::fs::rename(&tmp, &self.path)
            .map_err(|e| AvalonError::Internal(format!("rename vault: {e}")))?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = std::fs::metadata(&self.path)
                .map_err(|e| AvalonError::Internal(e.to_string()))?
                .permissions();
            perms.set_mode(0o600);
            let _ = std::fs::set_permissions(&self.path, perms);
        }
        Ok(())
    }

    pub fn create(
        &self,
        provider: &str,
        label: &str,
        value: &SecretBytes,
    ) -> AvalonResult<SecretMeta> {
        let (kmeta, key) = self.key_ring.get_active(KeyDomain::AgentSecrets)?;
        let secret_id = Uuid::new_v4().to_string();
        let blob = encrypt_with_key_id(
            &key,
            &kmeta.key_id,
            value.expose(),
            format!("secret:{secret_id}").as_bytes(),
        )?;
        let meta = SecretMeta {
            secret_id: secret_id.clone(),
            provider: provider.to_string(),
            label: label.to_string(),
            configured: true,
            created_at: Utc::now(),
            rotated_at: None,
        };
        self.index.write().insert(
            secret_id,
            StoredSecret {
                meta: meta.clone(),
                blob,
            },
        );
        self.persist()?;
        Ok(meta)
    }

    pub fn read_value(&self, secret_id: &str) -> AvalonResult<SecretBytes> {
        let guard = self.index.read();
        let stored = guard
            .get(secret_id)
            .ok_or_else(|| AvalonError::NotFound(format!("secret {secret_id}")))?;
        let (_meta, key) = self.key_ring.get_active(KeyDomain::AgentSecrets)?;
        let pt = decrypt(
            &key,
            &stored.blob,
            format!("secret:{secret_id}").as_bytes(),
        )
        .map_err(|_| {
            AvalonError::VaultLocked("unable to unwrap secret with active key".into())
        })?;
        Ok(SecretBytes::new(pt))
    }

    pub fn list_meta(&self) -> Vec<SecretMeta> {
        self.index
            .read()
            .values()
            .map(|s| s.meta.clone())
            .collect()
    }

    pub fn delete(&self, secret_id: &str) -> AvalonResult<()> {
        let removed = self.index.write().remove(secret_id).is_some();
        if !removed {
            return Err(AvalonError::NotFound(format!("secret {secret_id}")));
        }
        self.persist()
    }

    pub fn rotate_value(&self, secret_id: &str, new_value: &SecretBytes) -> AvalonResult<SecretMeta> {
        let (kmeta, key) = self.key_ring.get_active(KeyDomain::AgentSecrets)?;
        let mut guard = self.index.write();
        let stored = guard
            .get_mut(secret_id)
            .ok_or_else(|| AvalonError::NotFound(format!("secret {secret_id}")))?;
        stored.blob = encrypt_with_key_id(
            &key,
            &kmeta.key_id,
            new_value.expose(),
            format!("secret:{secret_id}").as_bytes(),
        )?;
        stored.meta.rotated_at = Some(Utc::now());
        let meta = stored.meta.clone();
        drop(guard);
        self.persist()?;
        Ok(meta)
    }

    pub fn is_unlocked(&self) -> bool {
        self.key_ring.get_active(KeyDomain::Vault).is_ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::provider::DevFileRootKeyProvider;
    use tempfile::tempdir;

    #[test]
    fn vault_create_read_no_plaintext_on_disk() {
        let dir = tempdir().unwrap();
        let provider = Arc::new(DevFileRootKeyProvider::new(dir.path()).unwrap());
        let ring = Arc::new(KeyRing::open_or_create(provider, dir.path()).unwrap());
        let vault = SecureVault::open(dir.path().join("vault.bin"), ring).unwrap();
        let meta = vault
            .create("fred", "FRED API", &SecretBytes::new(b"super-secret-key".to_vec()))
            .unwrap();
        let disk = std::fs::read(dir.path().join("vault.bin")).unwrap();
        let as_str = String::from_utf8_lossy(&disk);
        assert!(!as_str.contains("super-secret-key"));
        let value = vault.read_value(&meta.secret_id).unwrap();
        assert_eq!(value.expose(), b"super-secret-key");
        let listed = vault.list_meta();
        assert_eq!(listed.len(), 1);
        assert!(listed[0].configured);
    }
}
