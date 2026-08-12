//! Encrypted `.avalon-backup` archives.

use avalon_security::{decrypt, encrypt_with_key_id, AvalonError, AvalonResult, SecretBytes};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupManifest {
    pub format: String,
    pub platform_version: String,
    pub schema_version: u32,
    pub created_at: String,
    pub checksum_sha256: String,
    pub includes_secrets: bool,
}

pub struct BackupManager {
    dir: PathBuf,
    key: SecretBytes,
    key_id: String,
}

impl BackupManager {
    pub fn new(dir: PathBuf, key: SecretBytes, key_id: String) -> Self {
        let _ = std::fs::create_dir_all(&dir);
        Self { dir, key, key_id }
    }

    pub fn backup(
        &self,
        data_dir: &Path,
        platform_version: &str,
    ) -> AvalonResult<(PathBuf, BackupManifest)> {
        // Collect non-secret operational files (sealed db + audit). Secrets remain in vault seal separately optional.
        let mut payload = serde_json::Map::new();
        let db = data_dir.join("avalon_core.db");
        if db.exists() {
            let bytes = std::fs::read(&db).map_err(|e| AvalonError::Internal(e.to_string()))?;
            payload.insert("avalon_core.db".into(), serde_json::json!(base64_encode(&bytes)));
        }
        let audit = data_dir.join("logs").join("audit.jsonl");
        // Also try paths relative
        let audit2 = data_dir
            .parent()
            .map(|p| p.join("logs").join("audit.jsonl"))
            .unwrap_or(audit);
        // Prefer reading from known relative under data_dir structure — caller passes data_dir
        let logs = data_dir.join("../logs/audit.jsonl");
        for candidate in [data_dir.join("audit.jsonl"), audit2, logs] {
            if candidate.exists() {
                let bytes =
                    std::fs::read(&candidate).map_err(|e| AvalonError::Internal(e.to_string()))?;
                payload.insert(
                    "audit.jsonl".into(),
                    serde_json::json!(base64_encode(&bytes)),
                );
                break;
            }
        }

        let plaintext = serde_json::to_vec(&payload).map_err(|e| AvalonError::Internal(e.to_string()))?;
        let checksum = hex::encode(Sha256::digest(&plaintext));
        let blob = encrypt_with_key_id(
            &self.key,
            &self.key_id,
            &plaintext,
            b"avalon-backup-v1",
        )?;
        let manifest = BackupManifest {
            format: "avalon-backup".into(),
            platform_version: platform_version.into(),
            schema_version: 1,
            created_at: Utc::now().to_rfc3339(),
            checksum_sha256: checksum.clone(),
            includes_secrets: false,
        };
        let archive = serde_json::json!({
            "manifest": manifest,
            "ciphertext": blob,
        });
        let name = format!(
            "avalon-{}.avalon-backup",
            Utc::now().format("%Y%m%dT%H%M%SZ")
        );
        let path = self.dir.join(name);
        std::fs::write(
            &path,
            serde_json::to_vec_pretty(&archive).map_err(|e| AvalonError::Internal(e.to_string()))?,
        )
        .map_err(|e| AvalonError::Internal(e.to_string()))?;
        Ok((path, BackupManifest {
            format: "avalon-backup".into(),
            platform_version: platform_version.into(),
            schema_version: 1,
            created_at: Utc::now().to_rfc3339(),
            checksum_sha256: checksum,
            includes_secrets: false,
        }))
    }

    pub fn verify(&self, path: &Path) -> AvalonResult<BackupManifest> {
        let raw = std::fs::read(path).map_err(|e| AvalonError::Internal(e.to_string()))?;
        let v: serde_json::Value =
            serde_json::from_slice(&raw).map_err(|e| AvalonError::InvalidArgument(e.to_string()))?;
        let manifest: BackupManifest = serde_json::from_value(v["manifest"].clone())
            .map_err(|e| AvalonError::InvalidArgument(e.to_string()))?;
        let blob: avalon_security::AeadBlob = serde_json::from_value(v["ciphertext"].clone())
            .map_err(|e| AvalonError::SecurityViolation(e.to_string()))?;
        let pt = decrypt(&self.key, &blob, b"avalon-backup-v1")?;
        let checksum = hex::encode(Sha256::digest(&pt));
        if checksum != manifest.checksum_sha256 {
            return Err(AvalonError::SecurityViolation(
                "backup checksum mismatch".into(),
            ));
        }
        Ok(manifest)
    }

    pub fn restore_dry_run(&self, path: &Path) -> AvalonResult<serde_json::Value> {
        let raw = std::fs::read(path).map_err(|e| AvalonError::Internal(e.to_string()))?;
        let v: serde_json::Value =
            serde_json::from_slice(&raw).map_err(|e| AvalonError::InvalidArgument(e.to_string()))?;
        let blob: avalon_security::AeadBlob = serde_json::from_value(v["ciphertext"].clone())
            .map_err(|e| AvalonError::SecurityViolation(e.to_string()))?;
        let pt = decrypt(&self.key, &blob, b"avalon-backup-v1")?;
        let payload: serde_json::Value =
            serde_json::from_slice(&pt).map_err(|e| AvalonError::Internal(e.to_string()))?;
        Ok(serde_json::json!({
            "dry_run": true,
            "files": payload.as_object().map(|o| o.keys().cloned().collect::<Vec<_>>()).unwrap_or_default()
        }))
    }

    pub fn restore(&self, path: &Path, target_dir: &Path) -> AvalonResult<()> {
        let plan = self.restore_dry_run(path)?;
        let raw = std::fs::read(path).map_err(|e| AvalonError::Internal(e.to_string()))?;
        let v: serde_json::Value =
            serde_json::from_slice(&raw).map_err(|e| AvalonError::InvalidArgument(e.to_string()))?;
        let blob: avalon_security::AeadBlob = serde_json::from_value(v["ciphertext"].clone())
            .map_err(|e| AvalonError::SecurityViolation(e.to_string()))?;
        let pt = decrypt(&self.key, &blob, b"avalon-backup-v1")?;
        let payload: serde_json::Map<String, serde_json::Value> = serde_json::from_slice(&pt)
            .map_err(|e| AvalonError::Internal(e.to_string()))?;
        std::fs::create_dir_all(target_dir).map_err(|e| AvalonError::Internal(e.to_string()))?;
        for (name, val) in payload {
            let b64 = val.as_str().unwrap_or("");
            let bytes = base64_decode(b64)?;
            std::fs::write(target_dir.join(&name), bytes)
                .map_err(|e| AvalonError::Internal(e.to_string()))?;
        }
        let _ = plan;
        Ok(())
    }
}

fn base64_encode(bytes: &[u8]) -> String {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD.encode(bytes)
}

fn base64_decode(s: &str) -> AvalonResult<Vec<u8>> {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD
        .decode(s)
        .map_err(|e| AvalonError::InvalidArgument(e.to_string()))
}
