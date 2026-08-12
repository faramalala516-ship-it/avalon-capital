# Secure Recovery

DPAPI/user-bound root keys mean data may be unrecoverable after Windows profile destruction or account migration without a recovery backup.

Procedure:
1. Maintain encrypted `.avalon-backup` on external media.
2. On new machine/profile: reinstall Avalon → restore backup → re-wrap root via first-run if needed.
3. If only DPAPI root sealed blob exists and user profile is gone: **data is not recoverable** — document this to operators.
4. Never export root keys to plaintext tickets.
