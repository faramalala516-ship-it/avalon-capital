//! Platform paths, health aggregation helpers, resource governor, safe mode.

use avalon_security::{AvalonResult, SecurityStatus};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use sysinfo::System;

pub const APP_NAME: &str = "Avalon Agentique Platform";
pub const VENDOR: &str = "Avalon Capital";
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const BUILD_NUMBER: &str = "20260731.1";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformPaths {
    pub install_dir: PathBuf,
    pub data_dir: PathBuf,
    pub secure_dir: PathBuf,
    pub workspace_dir: PathBuf,
    pub logs_dir: PathBuf,
    pub cache_dir: PathBuf,
    pub backups_dir: PathBuf,
}

impl PlatformPaths {
    /// Resolve user-scoped data directories. Never store secrets beside the executable.
    pub fn resolve(data_override: Option<PathBuf>) -> AvalonResult<Self> {
        let data_dir = data_override.unwrap_or_else(|| {
            dirs::data_local_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(VENDOR)
                .join("Agentique Platform")
        });
        let secure_dir = data_dir.join("secure");
        let workspace_dir = data_dir.join("workspaces");
        let logs_dir = data_dir.join("logs");
        let cache_dir = data_dir.join("cache");
        let backups_dir = data_dir.join("backups");
        for d in [
            &data_dir,
            &secure_dir,
            &workspace_dir,
            &logs_dir,
            &cache_dir,
            &backups_dir,
        ] {
            let _ = std::fs::create_dir_all(d);
        }
        Ok(Self {
            install_dir: std::env::current_exe()
                .ok()
                .and_then(|p| p.parent().map(|p| p.to_path_buf()))
                .unwrap_or_else(|| PathBuf::from(".")),
            data_dir,
            secure_dir,
            workspace_dir,
            logs_dir,
            cache_dir,
            backups_dir,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceLimits {
    pub max_memory_mb: u64,
    pub max_cpu_soft_percent: u8,
    pub max_concurrent_jobs: u32,
    pub max_subprocesses: u32,
    pub timeout_secs: u64,
    pub storage_quota_bytes: u64,
}

impl Default for ResourceLimits {
    fn default() -> Self {
        Self {
            max_memory_mb: 1024,
            max_cpu_soft_percent: 50,
            max_concurrent_jobs: 4,
            max_subprocesses: 8,
            timeout_secs: 300,
            storage_quota_bytes: 2_147_483_648,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceSnapshot {
    pub cpu_percent: f32,
    pub memory_used_mb: u64,
    pub memory_total_mb: u64,
    pub disk_available_mb: u64,
}

pub struct ResourceGovernor;

impl ResourceGovernor {
    pub fn snapshot() -> ResourceSnapshot {
        let mut sys = System::new_all();
        sys.refresh_all();
        ResourceSnapshot {
            cpu_percent: sys.global_cpu_usage(),
            memory_used_mb: sys.used_memory() / 1024 / 1024,
            memory_total_mb: sys.total_memory() / 1024 / 1024,
            disk_available_mb: 0,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SafeMode {
    Normal,
    AvalonSafeMode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentHealth {
    pub name: String,
    pub healthy: bool,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoreHealth {
    pub overall: SecurityStatus,
    pub safe_mode: SafeMode,
    pub components: Vec<ComponentHealth>,
    pub version: String,
    pub build: String,
}

pub fn aggregate_health(components: Vec<ComponentHealth>, safe_mode: SafeMode) -> CoreHealth {
    let all_healthy = components.iter().all(|c| c.healthy);
    let any_critical_down = components.iter().any(|c| {
        !c.healthy && matches!(c.name.as_str(), "vault" | "database" | "permissions" | "audit")
    });
    let overall = if safe_mode == SafeMode::AvalonSafeMode {
        SecurityStatus::Degraded
    } else if any_critical_down {
        SecurityStatus::Degraded
    } else if all_healthy {
        SecurityStatus::Secure
    } else {
        SecurityStatus::Degraded
    };
    CoreHealth {
        overall,
        safe_mode,
        components,
        version: VERSION.to_string(),
        build: BUILD_NUMBER.to_string(),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalIdentity {
    pub identity_id: String,
    pub display_name: String,
    pub created_at: String,
}
