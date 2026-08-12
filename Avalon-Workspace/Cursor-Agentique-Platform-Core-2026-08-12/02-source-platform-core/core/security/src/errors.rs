use serde::{Deserialize, Serialize};
use thiserror::Error;

pub type AvalonResult<T> = Result<T, AvalonError>;

#[derive(Debug, Error, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "error", content = "detail")]
pub enum AvalonError {
    #[error("permission denied: {0}")]
    PermissionDenied(String),
    #[error("vault locked: {0}")]
    VaultLocked(String),
    #[error("agent unavailable: {0}")]
    AgentUnavailable(String),
    #[error("network denied: {0}")]
    NetworkDenied(String),
    #[error("invalid manifest: {0}")]
    InvalidManifest(String),
    #[error("version mismatch: {0}")]
    VersionMismatch(String),
    #[error("tool execution failed: {0}")]
    ToolExecutionFailed(String),
    #[error("data unavailable: {0}")]
    DataUnavailable(String),
    #[error("security violation: {0}")]
    SecurityViolation(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("invalid argument: {0}")]
    InvalidArgument(String),
    #[error("internal error: {0}")]
    Internal(String),
}
