use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SecurityStatus {
    Secure,
    Degraded,
    Locked,
    CompromisedSuspected,
    Unknown,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum NetworkMode {
    Online,
    SyncOnly,
    OfflineLock,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[repr(u8)]
pub enum RiskLevel {
    ReadOnly = 0,
    LocalSafeWrite = 1,
    ExternalAccess = 2,
    SystemModification = 3,
    PrivilegedAdmin = 4,
}

impl RiskLevel {
    pub fn from_u8(v: u8) -> Option<Self> {
        match v {
            0 => Some(Self::ReadOnly),
            1 => Some(Self::LocalSafeWrite),
            2 => Some(Self::ExternalAccess),
            3 => Some(Self::SystemModification),
            4 => Some(Self::PrivilegedAdmin),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum KeyDomain {
    Vault,
    Database,
    AgentSecrets,
    Audit,
    Backup,
    Session,
}

impl KeyDomain {
    pub fn info(self) -> &'static [u8] {
        match self {
            Self::Vault => b"avalon/kek/vault/v1",
            Self::Database => b"avalon/kek/database/v1",
            Self::AgentSecrets => b"avalon/kek/agent-secrets/v1",
            Self::Audit => b"avalon/kek/audit/v1",
            Self::Backup => b"avalon/kek/backup/v1",
            Self::Session => b"avalon/kek/session/v1",
        }
    }

    pub fn as_str(self) -> &'static str {
        match self {
            Self::Vault => "vault-key",
            Self::Database => "database-key",
            Self::AgentSecrets => "agent-secrets-key",
            Self::Audit => "audit-key",
            Self::Backup => "backup-key",
            Self::Session => "session-key",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum KeyStatus {
    Active,
    Deprecated,
    Revoked,
}

/// Anti-hallucination claim kinds for structured agent outputs.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ClaimKind {
    Fact,
    Calculation,
    ModelEstimate,
    Inference,
    Scenario,
    Unknown,
}
