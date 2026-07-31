use serde::{Deserialize, Serialize};
use std::fmt;
use zeroize::{Zeroize, ZeroizeOnDrop};

/// Secret byte container that zeroizes on drop. Never log or serialize contents.
#[derive(Clone, Zeroize, ZeroizeOnDrop)]
pub struct SecretBytes {
    bytes: Vec<u8>,
}

impl SecretBytes {
    pub fn new(bytes: Vec<u8>) -> Self {
        Self { bytes }
    }

    pub fn random(len: usize) -> Self {
        use rand::RngCore;
        let mut bytes = vec![0u8; len];
        rand::thread_rng().fill_bytes(&mut bytes);
        Self { bytes }
    }

    pub fn expose(&self) -> &[u8] {
        &self.bytes
    }

    pub fn len(&self) -> usize {
        self.bytes.len()
    }

    pub fn is_empty(&self) -> bool {
        self.bytes.is_empty()
    }
}

impl fmt::Debug for SecretBytes {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "SecretBytes(len={}, REDACTED)", self.bytes.len())
    }
}

/// Metadata-only secret reference safe for UI/API responses (never contains values).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecretRef {
    pub secret_id: String,
    pub provider: String,
    pub label: String,
    pub configured: bool,
}

impl SecretRef {
    pub fn from_parts(secret_id: &str, provider: &str, label: &str, configured: bool) -> Self {
        Self {
            secret_id: secret_id.to_string(),
            provider: provider.to_string(),
            label: label.to_string(),
            configured,
        }
    }
}
