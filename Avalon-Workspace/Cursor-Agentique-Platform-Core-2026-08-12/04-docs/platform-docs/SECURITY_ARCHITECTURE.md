# Security Architecture

Defense in depth. Fail closed.

- Root keys: Windows DPAPI (user scope) or DevFileRootKeyProvider (non-Windows/CI)
- KEKs per domain via HKDF-SHA256; DEKs for vault/DB/backup/session/audit/agent-secrets
- Application AEAD: AES-256-GCM (nonce, tag, AAD, crypto_version, key_id)
- Core DB: AES-256-GCM sealed SQLite at rest (`avalon_core.db`) — not plaintext SQLite
- Permissions: deny-by-default; no raw admin shell APIs
- PrivilegeBroker: typed ops only
- NetworkBroker: allowlists + ONLINE/SYNC_ONLY/OFFLINE_LOCK
- Audit: hash-chained JSONL (tamper-evident)
- Frontend never receives secret values
