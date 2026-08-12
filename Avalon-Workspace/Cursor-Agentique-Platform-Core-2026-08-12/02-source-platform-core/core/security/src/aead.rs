use aes_gcm::{
    aead::{Aead, KeyInit, Payload},
    Aes256Gcm, Nonce,
};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

use crate::errors::{AvalonError, AvalonResult};
use crate::secret::SecretBytes;

pub const CRYPTO_VERSION_AES256_GCM: u16 = 1;
pub const NONCE_LEN: usize = 12;
pub const TAG_LEN: usize = 16;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AeadBlob {
    pub crypto_version: u16,
    pub key_id: String,
    pub nonce: Vec<u8>,
    /// Ciphertext inclusive of AES-GCM tag (as produced by `aes-gcm` crate).
    pub ciphertext: Vec<u8>,
}

impl Drop for AeadBlob {
    fn drop(&mut self) {
        self.nonce.zeroize();
        self.ciphertext.zeroize();
    }
}

pub fn encrypt(key: &SecretBytes, plaintext: &[u8], aad: &[u8]) -> AvalonResult<AeadBlob> {
    encrypt_with_key_id(key, "default", plaintext, aad)
}

pub fn encrypt_with_key_id(
    key: &SecretBytes,
    key_id: &str,
    plaintext: &[u8],
    aad: &[u8],
) -> AvalonResult<AeadBlob> {
    if key.expose().len() != 32 {
        return Err(AvalonError::SecurityViolation(
            "AES-256-GCM requires a 32-byte key".into(),
        ));
    }
    let cipher = Aes256Gcm::new_from_slice(key.expose())
        .map_err(|e| AvalonError::SecurityViolation(e.to_string()))?;
    let mut nonce_bytes = [0u8; NONCE_LEN];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(
            nonce,
            Payload {
                msg: plaintext,
                aad,
            },
        )
        .map_err(|_| AvalonError::SecurityViolation("AES-GCM encrypt failed".into()))?;
    Ok(AeadBlob {
        crypto_version: CRYPTO_VERSION_AES256_GCM,
        key_id: key_id.to_string(),
        nonce: nonce_bytes.to_vec(),
        ciphertext,
    })
}

pub fn decrypt(key: &SecretBytes, blob: &AeadBlob, aad: &[u8]) -> AvalonResult<Vec<u8>> {
    if blob.crypto_version != CRYPTO_VERSION_AES256_GCM {
        return Err(AvalonError::SecurityViolation(format!(
            "unsupported crypto_version {}",
            blob.crypto_version
        )));
    }
    if key.expose().len() != 32 {
        return Err(AvalonError::SecurityViolation(
            "AES-256-GCM requires a 32-byte key".into(),
        ));
    }
    if blob.nonce.len() != NONCE_LEN {
        return Err(AvalonError::SecurityViolation("invalid nonce length".into()));
    }
    let cipher = Aes256Gcm::new_from_slice(key.expose())
        .map_err(|e| AvalonError::SecurityViolation(e.to_string()))?;
    let nonce = Nonce::from_slice(&blob.nonce);
    cipher
        .decrypt(
            nonce,
            Payload {
                msg: &blob.ciphertext,
                aad,
            },
        )
        .map_err(|_| AvalonError::SecurityViolation("AES-GCM decrypt/tamper failure".into()))
}
