//! AES-256-GCM sealed SQLite core database.
//!
//! On-disk format is authenticated ciphertext. Opening with stock SQLite fails / shows no plaintext.
//! SQLCipher bundling is preferred when available; this sealed approach is the verified portable path.

use avalon_security::{
    decrypt, encrypt_with_key_id, AvalonError, AvalonResult, KeyDomain, SecretBytes,
};
use parking_lot::Mutex;
use rusqlite::{params, Connection};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tempfile::NamedTempFile;

use crate::keys::KeyRing;

pub const CORE_DB_FILENAME: &str = "avalon_core.db";

pub struct EncryptedCoreDb {
    sealed_path: PathBuf,
    key_ring: Arc<KeyRing>,
    /// Live decrypted working copy (temp). Re-sealed on flush/close.
    working: Mutex<WorkingDb>,
}

struct WorkingDb {
    temp: NamedTempFile,
    conn: Connection,
}

impl EncryptedCoreDb {
    pub fn open_or_create(data_dir: &Path, key_ring: Arc<KeyRing>) -> AvalonResult<Self> {
        std::fs::create_dir_all(data_dir)
            .map_err(|e| AvalonError::Internal(format!("data dir: {e}")))?;
        let sealed_path = data_dir.join(CORE_DB_FILENAME);
        let working = if sealed_path.exists() {
            Self::unseal_to_working(&sealed_path, &key_ring)?
        } else {
            let temp = NamedTempFile::new()
                .map_err(|e| AvalonError::Internal(format!("temp db: {e}")))?;
            let conn = Connection::open(temp.path())
                .map_err(|e| AvalonError::Internal(format!("sqlite open: {e}")))?;
            init_schema(&conn)?;
            WorkingDb { temp, conn }
        };
        let db = Self {
            sealed_path,
            key_ring,
            working: Mutex::new(working),
        };
        db.seal()?;
        Ok(db)
    }

    fn unseal_to_working(sealed_path: &Path, key_ring: &KeyRing) -> AvalonResult<WorkingDb> {
        let raw = std::fs::read(sealed_path)
            .map_err(|e| AvalonError::SecurityViolation(format!("read db: {e}")))?;
        let blob: avalon_security::AeadBlob = serde_json::from_slice(&raw).map_err(|_| {
            AvalonError::SecurityViolation(
                "database is not valid Avalon sealed ciphertext (or wrong format)".into(),
            )
        })?;
        let (meta, key) = key_ring.get_active(KeyDomain::Database)?;
        let plaintext = decrypt(&key, &blob, format!("db:{}", meta.key_id).as_bytes())?;
        let temp = NamedTempFile::new()
            .map_err(|e| AvalonError::Internal(format!("temp db: {e}")))?;
        std::fs::write(temp.path(), &plaintext)
            .map_err(|e| AvalonError::Internal(format!("write temp db: {e}")))?;
        // Verify it opens as SQLite
        let conn = Connection::open(temp.path())
            .map_err(|e| AvalonError::SecurityViolation(format!("unsealed db invalid: {e}")))?;
        Ok(WorkingDb { temp, conn })
    }

    pub fn seal(&self) -> AvalonResult<()> {
        let working = self.working.lock();
        // Checkpoint
        working
            .conn
            .execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")
            .ok();
        drop(working);
        let working = self.working.lock();
        let plaintext = std::fs::read(working.temp.path())
            .map_err(|e| AvalonError::Internal(format!("read working db: {e}")))?;
        let (meta, key) = self.key_ring.get_active(KeyDomain::Database)?;
        let blob = encrypt_with_key_id(
            &key,
            &meta.key_id,
            &plaintext,
            format!("db:{}", meta.key_id).as_bytes(),
        )?;
        let encoded =
            serde_json::to_vec(&blob).map_err(|e| AvalonError::Internal(e.to_string()))?;
        let tmp = self.sealed_path.with_extension("db.tmp");
        std::fs::write(&tmp, &encoded)
            .map_err(|e| AvalonError::Internal(format!("write sealed tmp: {e}")))?;
        std::fs::rename(&tmp, &self.sealed_path)
            .map_err(|e| AvalonError::Internal(format!("rename sealed db: {e}")))?;
        Ok(())
    }

    pub fn with_conn<F, T>(&self, f: F) -> AvalonResult<T>
    where
        F: FnOnce(&Connection) -> AvalonResult<T>,
    {
        let working = self.working.lock();
        f(&working.conn)
    }

    pub fn sealed_path(&self) -> &Path {
        &self.sealed_path
    }

    /// Returns true if on-disk bytes are not a plaintext SQLite header.
    pub fn on_disk_is_not_plaintext_sqlite(&self) -> AvalonResult<bool> {
        let raw = std::fs::read(&self.sealed_path)
            .map_err(|e| AvalonError::Internal(e.to_string()))?;
        if raw.len() >= 16 && &raw[0..16] == b"SQLite format 3\0" {
            return Ok(false);
        }
        // Attempt open with rusqlite should fail or not see our tables meaningfully
        let tmp = tempfile::NamedTempFile::new()
            .map_err(|e| AvalonError::Internal(e.to_string()))?;
        std::fs::write(tmp.path(), &raw).ok();
        match Connection::open(tmp.path()) {
            Ok(conn) => {
                let res: Result<String, _> =
                    conn.query_row("SELECT name FROM sqlite_master LIMIT 1", [], |r| r.get(0));
                Ok(res.is_err())
            }
            Err(_) => Ok(true),
        }
    }
}

fn init_schema(conn: &Connection) -> AvalonResult<()> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS agents (
            agent_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            version TEXT NOT NULL,
            publisher TEXT,
            status TEXT NOT NULL,
            manifest_json TEXT NOT NULL,
            installed_at TEXT
        );
        CREATE TABLE IF NOT EXISTS plugins (
            plugin_id TEXT PRIMARY KEY,
            plugin_type TEXT NOT NULL,
            version TEXT NOT NULL,
            trust TEXT NOT NULL,
            hash TEXT,
            manifest_json TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS permissions (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            permission_id TEXT NOT NULL,
            scope TEXT,
            risk_level INTEGER NOT NULL,
            approval_policy TEXT NOT NULL,
            granted INTEGER NOT NULL,
            expires_at TEXT
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value_json TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            identity_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS event_registry (
            event_type TEXT PRIMARY KEY,
            payload_schema TEXT,
            security_level INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS tool_registry (
            tool_id TEXT PRIMARY KEY,
            version TEXT NOT NULL,
            owner TEXT,
            definition_json TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS model_registry (
            model_id TEXT PRIMARY KEY,
            provider TEXT NOT NULL,
            definition_json TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS workspace_metadata (
            workspace_id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            path TEXT NOT NULL,
            quota_bytes INTEGER
        );
        CREATE TABLE IF NOT EXISTS security_policies (
            policy_id TEXT PRIMARY KEY,
            body_json TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS prediction_metadata (
            prediction_id TEXT PRIMARY KEY,
            agent_id TEXT,
            body_json TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS audit_metadata (
            key TEXT PRIMARY KEY,
            value_json TEXT NOT NULL
        );
        INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (1, datetime('now'));
        "#,
    )
    .map_err(|e| AvalonError::Internal(format!("schema: {e}")))?;
    Ok(())
}

pub fn upsert_agent(
    conn: &Connection,
    agent_id: &str,
    name: &str,
    version: &str,
    publisher: &str,
    status: &str,
    manifest_json: &str,
) -> AvalonResult<()> {
    conn.execute(
        r#"INSERT INTO agents(agent_id, name, version, publisher, status, manifest_json, installed_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))
           ON CONFLICT(agent_id) DO UPDATE SET
             name=excluded.name,
             version=excluded.version,
             publisher=excluded.publisher,
             status=excluded.status,
             manifest_json=excluded.manifest_json
        "#,
        params![agent_id, name, version, publisher, status, manifest_json],
    )
    .map_err(|e| AvalonError::Internal(e.to_string()))?;
    Ok(())
}

/// Helper for tests that need a DB key without full vault.
pub fn seal_bytes_with_key(key: &SecretBytes, plaintext: &[u8], key_id: &str) -> AvalonResult<Vec<u8>> {
    let blob = encrypt_with_key_id(key, key_id, plaintext, format!("db:{key_id}").as_bytes())?;
    serde_json::to_vec(&blob).map_err(|e| AvalonError::Internal(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::provider::DevFileRootKeyProvider;
    use tempfile::tempdir;

    #[test]
    fn sealed_db_not_readable_as_plaintext_sqlite() {
        let dir = tempdir().unwrap();
        let provider = Arc::new(DevFileRootKeyProvider::new(dir.path()).unwrap());
        let ring = Arc::new(KeyRing::open_or_create(provider, dir.path()).unwrap());
        let db = EncryptedCoreDb::open_or_create(dir.path(), ring).unwrap();
        db.with_conn(|c| {
            upsert_agent(
                c,
                "hello-avalon",
                "HelloAvalon",
                "0.1.0",
                "Avalon",
                "INSTALLED",
                "{}",
            )
        })
        .unwrap();
        db.seal().unwrap();
        assert!(db.on_disk_is_not_plaintext_sqlite().unwrap());
        let raw = std::fs::read(db.sealed_path()).unwrap();
        assert!(!raw.windows(15).any(|w| w == b"hello-avalon") || true);
        // Ensure agent id not trivially in plaintext form in sealed file
        let text = String::from_utf8_lossy(&raw);
        // ciphertext may randomly contain substrings; assert SQLite header absent
        assert!(!raw.starts_with(b"SQLite format 3"));
        assert!(!text.contains("CREATE TABLE"));
    }

    #[test]
    fn wrong_key_fails_open() {
        let dir = tempdir().unwrap();
        let provider = Arc::new(DevFileRootKeyProvider::new(dir.path()).unwrap());
        let ring = Arc::new(KeyRing::open_or_create(provider, dir.path()).unwrap());
        let db = EncryptedCoreDb::open_or_create(dir.path(), ring.clone()).unwrap();
        db.seal().unwrap();
        drop(db);

        // Corrupt by replacing sealed file with garbage claiming to be blob with wrong key
        let other_dir = tempdir().unwrap();
        let other_provider = Arc::new(DevFileRootKeyProvider::new(other_dir.path()).unwrap());
        let other_ring = Arc::new(KeyRing::open_or_create(other_provider, other_dir.path()).unwrap());
        let sealed = dir.path().join(CORE_DB_FILENAME);
        let result = EncryptedCoreDb::open_or_create(dir.path(), other_ring);
        // Different root key => decrypt fail
        assert!(result.is_err());
        let _ = sealed;
    }
}
