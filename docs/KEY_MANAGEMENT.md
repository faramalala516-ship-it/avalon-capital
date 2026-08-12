# Key Management

Hierarchy: Root → KEKs (vault, database, agent-secrets, audit, backup, session) → DEKs → data.

Statuses: ACTIVE, DEPRECATED, REVOKED. Rotation generates new key, activates, deprecates old. Never delete before migration verify.

Windows: `WindowsDpapiProvider`. Non-Windows: `DevFileRootKeyProvider` (development only).
