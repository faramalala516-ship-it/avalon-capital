//! AvalonSecureVault and encrypted core database.

mod db;
mod keys;
mod provider;
mod vault;

pub use db::{EncryptedCoreDb, CORE_DB_FILENAME};
pub use keys::{KeyMetadata, KeyRing};
pub use provider::{default_root_provider, DevFileRootKeyProvider, RootKeyProvider};
pub use vault::{SecretMeta, SecureVault};

#[cfg(windows)]
pub use provider::WindowsDpapiProvider;
