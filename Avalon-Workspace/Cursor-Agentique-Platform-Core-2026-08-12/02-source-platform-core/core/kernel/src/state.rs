use avalon_security::NetworkMode;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use avalon_system::SafeMode;
use avalon_security::SecurityStatus;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KernelConfig {
    pub data_dir: Option<PathBuf>,
    pub network_mode: NetworkMode,
    pub bind_api: bool,
    pub api_port: u16,
    pub dev_mode: bool,
}

impl Default for KernelConfig {
    fn default() -> Self {
        Self {
            data_dir: None,
            network_mode: NetworkMode::OfflineLock,
            bind_api: true,
            api_port: 8741,
            dev_mode: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformState {
    pub started_at: DateTime<Utc>,
    pub running: bool,
    pub safe_mode: SafeMode,
    pub first_run_complete: bool,
    pub security_status: SecurityStatus,
    pub network_mode: NetworkMode,
    pub last_backup: Option<String>,
    pub last_data_sync: Option<String>,
    pub warnings: Vec<String>,
}
