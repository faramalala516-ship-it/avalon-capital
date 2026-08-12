//! Avalon security primitives.
//!
//! Uses only standard AEAD constructions (AES-256-GCM). No homemade crypto.

mod aead;
mod errors;
mod secret;
mod types;

pub use aead::{
    decrypt, encrypt, encrypt_with_key_id, AeadBlob, CRYPTO_VERSION_AES256_GCM, NONCE_LEN,
    TAG_LEN,
};
pub use errors::{AvalonError, AvalonResult};
pub use secret::SecretBytes;
pub use types::{
    ClaimKind, KeyDomain, KeyStatus, NetworkMode, RiskLevel, SecurityStatus,
};

/// Derive a domain-separated key via HKDF-SHA256.
pub fn derive_key(master: &SecretBytes, domain: KeyDomain, salt: &[u8]) -> SecretBytes {
    use hkdf::Hkdf;
    use sha2::Sha256;

    let hk = Hkdf::<Sha256>::new(Some(salt), master.expose());
    let mut out = [0u8; 32];
    hk.expand(domain.info(), &mut out)
        .expect("HKDF expand length is valid");
    SecretBytes::new(out.to_vec())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aead_roundtrip_and_tamper_detect() {
        let key = SecretBytes::new(vec![7u8; 32]);
        let blob = encrypt(&key, b"vault-secret", b"aad-v1").unwrap();
        let pt = decrypt(&key, &blob, b"aad-v1").unwrap();
        assert_eq!(pt, b"vault-secret");

        let mut bad = blob.clone();
        bad.ciphertext[0] ^= 0xff;
        assert!(decrypt(&key, &bad, b"aad-v1").is_err());
    }

    #[test]
    fn wrong_key_fails() {
        let key = SecretBytes::new(vec![1u8; 32]);
        let other = SecretBytes::new(vec![2u8; 32]);
        let blob = encrypt(&key, b"data", b"aad").unwrap();
        assert!(decrypt(&other, &blob, b"aad").is_err());
    }

    #[test]
    fn derived_keys_differ_by_domain() {
        let master = SecretBytes::new(vec![9u8; 32]);
        let a = derive_key(&master, KeyDomain::Vault, b"salt");
        let b = derive_key(&master, KeyDomain::Database, b"salt");
        assert_ne!(a.expose(), b.expose());
    }
}
