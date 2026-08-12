# Cryptography

Libraries: `aes-gcm`, `hkdf`, `sha2`, `hmac`, `zeroize`.

No homemade algorithms. No base64-as-encryption. No XOR vaults.

SQLCipher: preferred when vendored toolchain available; V1 ships verified AES-256-GCM sealed SQLite files with the same security property for Acceptance Test G (stock SQLite cannot read plaintext tables).
