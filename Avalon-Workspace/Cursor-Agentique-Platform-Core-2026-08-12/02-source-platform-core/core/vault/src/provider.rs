use avalon_security::{AvalonError, AvalonResult, SecretBytes};

/// Abstraction over platform root-key protection.
pub trait RootKeyProvider: Send + Sync {
    fn name(&self) -> &'static str;
    fn protect(&self, plaintext: &SecretBytes) -> AvalonResult<Vec<u8>>;
    fn unprotect(&self, sealed: &[u8]) -> AvalonResult<SecretBytes>;
}

/// Development / non-Windows provider.
/// Stores an encrypted root key file using a machine-local random wrap key
/// kept beside the sealed blob with restrictive intent. **Not DPAPI.**
/// Used for CI and Linux development only.
pub struct DevFileRootKeyProvider {
    wrap_key_path: std::path::PathBuf,
}

impl DevFileRootKeyProvider {
    pub fn new(dir: impl AsRef<std::path::Path>) -> AvalonResult<Self> {
        let dir = dir.as_ref();
        std::fs::create_dir_all(dir)
            .map_err(|e| AvalonError::Internal(format!("create vault dir: {e}")))?;
        Ok(Self {
            wrap_key_path: dir.join(".dev_root_wrap_key"),
        })
    }

    fn load_or_create_wrap_key(&self) -> AvalonResult<SecretBytes> {
        if self.wrap_key_path.exists() {
            let bytes = std::fs::read(&self.wrap_key_path)
                .map_err(|e| AvalonError::VaultLocked(format!("read wrap key: {e}")))?;
            if bytes.len() != 32 {
                return Err(AvalonError::VaultLocked(
                    "corrupt development wrap key".into(),
                ));
            }
            Ok(SecretBytes::new(bytes))
        } else {
            let key = SecretBytes::random(32);
            std::fs::write(&self.wrap_key_path, key.expose())
                .map_err(|e| AvalonError::Internal(format!("write wrap key: {e}")))?;
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = std::fs::metadata(&self.wrap_key_path)
                    .map_err(|e| AvalonError::Internal(e.to_string()))?
                    .permissions();
                perms.set_mode(0o600);
                let _ = std::fs::set_permissions(&self.wrap_key_path, perms);
            }
            Ok(key)
        }
    }
}

impl RootKeyProvider for DevFileRootKeyProvider {
    fn name(&self) -> &'static str {
        "DevFileRootKeyProvider"
    }

    fn protect(&self, plaintext: &SecretBytes) -> AvalonResult<Vec<u8>> {
        let wrap = self.load_or_create_wrap_key()?;
        let blob = avalon_security::encrypt(&wrap, plaintext.expose(), b"avalon/root/v1")?;
        serde_json::to_vec(&blob).map_err(|e| AvalonError::Internal(e.to_string()))
    }

    fn unprotect(&self, sealed: &[u8]) -> AvalonResult<SecretBytes> {
        let wrap = self.load_or_create_wrap_key()?;
        let blob: avalon_security::AeadBlob =
            serde_json::from_slice(sealed).map_err(|e| AvalonError::VaultLocked(e.to_string()))?;
        let pt = avalon_security::decrypt(&wrap, &blob, b"avalon/root/v1")?;
        Ok(SecretBytes::new(pt))
    }
}

#[cfg(windows)]
pub struct WindowsDpapiProvider;

#[cfg(windows)]
impl RootKeyProvider for WindowsDpapiProvider {
    fn name(&self) -> &'static str {
        "WindowsDpapiProvider"
    }

    fn protect(&self, plaintext: &SecretBytes) -> AvalonResult<Vec<u8>> {
        use windows::core::PCWSTR;
        use windows::Win32::Foundation::{LocalFree, HLOCAL};
        use windows::Win32::Security::Cryptography::{
            CryptProtectData, CRYPTPROTECT_UI_FORBIDDEN, CRYPT_INTEGER_BLOB,
        };

        let mut in_blob = CRYPT_INTEGER_BLOB {
            cbData: plaintext.expose().len() as u32,
            pbData: plaintext.expose().as_ptr() as *mut u8,
        };
        let mut out_blob = CRYPT_INTEGER_BLOB {
            cbData: 0,
            pbData: std::ptr::null_mut(),
        };
        // SAFETY: CryptProtectData with user-scope DPAPI; buffers valid for call duration.
        unsafe {
            CryptProtectData(
                &mut in_blob,
                PCWSTR::null(),
                None,
                None,
                None,
                CRYPTPROTECT_UI_FORBIDDEN,
                &mut out_blob,
            )
            .map_err(|e| AvalonError::VaultLocked(format!("DPAPI protect failed: {e}")))?;
            let slice = std::slice::from_raw_parts(out_blob.pbData, out_blob.cbData as usize);
            let owned = slice.to_vec();
            let _ = LocalFree(HLOCAL(out_blob.pbData as *mut _));
            Ok(owned)
        }
    }

    fn unprotect(&self, sealed: &[u8]) -> AvalonResult<SecretBytes> {
        use windows::Win32::Foundation::{LocalFree, HLOCAL};
        use windows::Win32::Security::Cryptography::{
            CryptUnprotectData, CRYPTPROTECT_UI_FORBIDDEN, CRYPT_INTEGER_BLOB,
        };

        let mut in_blob = CRYPT_INTEGER_BLOB {
            cbData: sealed.len() as u32,
            pbData: sealed.as_ptr() as *mut u8,
        };
        let mut out_blob = CRYPT_INTEGER_BLOB {
            cbData: 0,
            pbData: std::ptr::null_mut(),
        };
        // SAFETY: CryptUnprotectData; output freed with LocalFree.
        unsafe {
            CryptUnprotectData(
                &mut in_blob,
                None,
                None,
                None,
                None,
                CRYPTPROTECT_UI_FORBIDDEN,
                &mut out_blob,
            )
            .map_err(|e| AvalonError::VaultLocked(format!("DPAPI unprotect failed: {e}")))?;
            let slice = std::slice::from_raw_parts(out_blob.pbData, out_blob.cbData as usize);
            let owned = SecretBytes::new(slice.to_vec());
            let _ = LocalFree(HLOCAL(out_blob.pbData as *mut _));
            Ok(owned)
        }
    }
}

pub fn default_root_provider(secure_dir: &std::path::Path) -> AvalonResult<Box<dyn RootKeyProvider>> {
    #[cfg(windows)]
    {
        let _ = secure_dir;
        Ok(Box::new(WindowsDpapiProvider))
    }
    #[cfg(not(windows))]
    {
        Ok(Box::new(DevFileRootKeyProvider::new(secure_dir)?))
    }
}
