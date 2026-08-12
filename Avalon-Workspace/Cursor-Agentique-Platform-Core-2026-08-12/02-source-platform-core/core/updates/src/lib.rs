//! Update engine — disabled/manual in V1 (prefer safe over silent insecure updates).

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ReleaseChannel {
    Stable,
    Beta,
    Dev,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateManifest {
    pub version: String,
    pub channel: ReleaseChannel,
    pub checksum: String,
    pub signature: Option<String>,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateEngine {
    pub enabled: bool,
    pub channel: ReleaseChannel,
    pub last_checked: Option<String>,
}

impl Default for UpdateEngine {
    fn default() -> Self {
        Self {
            enabled: false,
            channel: ReleaseChannel::Stable,
            last_checked: None,
        }
    }
}

impl UpdateEngine {
    pub fn check(&self) -> Result<(), String> {
        if !self.enabled {
            return Err("updater disabled in V1 — manual updates only".into());
        }
        Err("signed update verification not yet enabled".into())
    }
}
