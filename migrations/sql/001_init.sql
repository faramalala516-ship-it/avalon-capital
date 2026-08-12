-- Avalon Core schema migration v1
-- Applied programmatically by EncryptedCoreDb::init_schema

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);
