//! AvalonPermissionEngine — deny by default.

use avalon_audit::AuditLedger;
use avalon_security::{AvalonError, AvalonResult, RiskLevel};
use chrono::{DateTime, Utc};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ApprovalPolicy {
    Auto,
    Ask,
    Deny,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionDef {
    pub id: String,
    pub description: String,
    pub risk_level: RiskLevel,
    pub default_policy: ApprovalPolicy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrantedPermission {
    pub grant_id: String,
    pub agent_id: String,
    pub permission_id: String,
    pub scope: Option<String>,
    pub risk_level: RiskLevel,
    pub approval_policy: ApprovalPolicy,
    pub expires_at: Option<DateTime<Utc>>,
    pub session_only: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalRequest {
    pub request_id: String,
    pub agent_id: String,
    pub action: String,
    pub reason: String,
    pub scope: Option<String>,
    pub resource: String,
    pub risk_level: RiskLevel,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ApprovalDecision {
    AllowOnce,
    AllowForSession,
    AlwaysAllowScoped,
    Deny,
}

pub struct PermissionEngine {
    catalog: RwLock<HashMap<String, PermissionDef>>,
    grants: RwLock<HashMap<String, Vec<GrantedPermission>>>,
    pending: RwLock<HashMap<String, ApprovalRequest>>,
    session_grants: RwLock<HashSet<String>>,
    audit: Arc<AuditLedger>,
    available: RwLock<bool>,
}

impl PermissionEngine {
    pub fn new(audit: Arc<AuditLedger>) -> Self {
        let engine = Self {
            catalog: RwLock::new(HashMap::new()),
            grants: RwLock::new(HashMap::new()),
            pending: RwLock::new(HashMap::new()),
            session_grants: RwLock::new(HashSet::new()),
            audit,
            available: RwLock::new(true),
        };
        engine.seed_catalog();
        engine
    }

    fn seed_catalog(&self) {
        let defs = [
            ("filesystem.read.workspace", "Read agent workspace", RiskLevel::ReadOnly, ApprovalPolicy::Auto),
            ("filesystem.write.workspace", "Write agent workspace", RiskLevel::LocalSafeWrite, ApprovalPolicy::Auto),
            ("filesystem.read.external", "Read outside workspace", RiskLevel::ExternalAccess, ApprovalPolicy::Ask),
            ("network.api.fred", "Call FRED API", RiskLevel::ExternalAccess, ApprovalPolicy::Ask),
            ("network.api.bls", "Call BLS API", RiskLevel::ExternalAccess, ApprovalPolicy::Ask),
            ("application.excel.open", "Open Excel", RiskLevel::LocalSafeWrite, ApprovalPolicy::Ask),
            ("application.excel.write", "Write Excel workbook", RiskLevel::LocalSafeWrite, ApprovalPolicy::Ask),
            ("application.browser.open", "Open browser", RiskLevel::ExternalAccess, ApprovalPolicy::Ask),
            ("process.launch.allowed", "Launch registered application", RiskLevel::SystemModification, ApprovalPolicy::Ask),
            ("system.service.restart", "Restart Avalon service", RiskLevel::SystemModification, ApprovalPolicy::Ask),
            ("system.admin.install", "Install approved package", RiskLevel::PrivilegedAdmin, ApprovalPolicy::Deny),
            ("memory.read.self", "Read own memory", RiskLevel::ReadOnly, ApprovalPolicy::Auto),
            ("memory.write.self", "Write own memory", RiskLevel::LocalSafeWrite, ApprovalPolicy::Auto),
            ("memory.read.shared", "Read shared memory", RiskLevel::ExternalAccess, ApprovalPolicy::Ask),
            ("memory.publish.shared", "Publish shared memory", RiskLevel::LocalSafeWrite, ApprovalPolicy::Ask),
            ("shell.raw", "Raw shell execution", RiskLevel::PrivilegedAdmin, ApprovalPolicy::Deny),
        ];
        let mut cat = self.catalog.write();
        for (id, desc, risk, policy) in defs {
            cat.insert(
                id.to_string(),
                PermissionDef {
                    id: id.to_string(),
                    description: desc.to_string(),
                    risk_level: risk,
                    default_policy: policy,
                },
            );
        }
    }

    pub fn set_available(&self, available: bool) {
        *self.available.write() = available;
    }

    pub fn is_available(&self) -> bool {
        *self.available.read()
    }

    pub fn check(&self, agent_id: &str, permission_id: &str, scope: Option<&str>) -> AvalonResult<()> {
        if !self.is_available() {
            let _ = self.audit.append(
                agent_id,
                "permission.check",
                permission_id,
                "DENIED",
                None,
                Some(serde_json::json!({"reason": "permission engine unavailable"})),
            );
            return Err(AvalonError::PermissionDenied(
                "permission engine unavailable — fail closed".into(),
            ));
        }

        // Absolute deny for raw shell
        if permission_id == "shell.raw"
            || permission_id.contains("powershell")
            || permission_id.contains("cmd.exe")
        {
            let _ = self.audit.append(
                agent_id,
                "permission.denied",
                permission_id,
                "DENIED",
                None,
                Some(serde_json::json!({"reason": "raw admin shell forbidden"})),
            );
            return Err(AvalonError::PermissionDenied(
                "raw admin shell is forbidden".into(),
            ));
        }

        let catalog = self.catalog.read();
        let def = catalog.get(permission_id).ok_or_else(|| {
            let _ = self.audit.append(
                agent_id,
                "permission.denied",
                permission_id,
                "DENIED",
                None,
                Some(serde_json::json!({"reason": "unknown permission"})),
            );
            AvalonError::PermissionDenied(format!("unknown permission {permission_id}"))
        })?;

        if def.default_policy == ApprovalPolicy::Deny {
            let _ = self.audit.append(
                agent_id,
                "permission.denied",
                permission_id,
                "DENIED",
                None,
                Some(serde_json::json!({"reason": "default deny"})),
            );
            return Err(AvalonError::PermissionDenied(format!(
                "{permission_id} denied by policy"
            )));
        }

        let grants = self.grants.read();
        let agent_grants = grants.get(agent_id).cloned().unwrap_or_default();
        let session = self.session_grants.read();
        let now = Utc::now();
        for g in &agent_grants {
            if g.permission_id != permission_id {
                continue;
            }
            if let Some(exp) = g.expires_at {
                if exp < now {
                    continue;
                }
            }
            if let (Some(gs), Some(s)) = (&g.scope, scope) {
                if gs != s {
                    continue;
                }
            }
            if g.session_only && !session.contains(&g.grant_id) {
                continue;
            }
            let _ = self.audit.append(
                agent_id,
                "permission.granted",
                permission_id,
                "OK",
                None,
                None,
            );
            return Ok(());
        }

        if def.default_policy == ApprovalPolicy::Auto && def.risk_level <= RiskLevel::LocalSafeWrite {
            // Still deny-by-default for ungranted — Auto only applies AFTER grant or for built-in workspace perms if explicitly bootstrapped
            let _ = self.audit.append(
                agent_id,
                "permission.denied",
                permission_id,
                "DENIED",
                None,
                Some(serde_json::json!({"reason": "not granted"})),
            );
            return Err(AvalonError::PermissionDenied(format!(
                "{permission_id} not granted"
            )));
        }

        let _ = self.audit.append(
            agent_id,
            "permission.denied",
            permission_id,
            "DENIED",
            None,
            Some(serde_json::json!({"reason": "requires approval or not granted"})),
        );
        Err(AvalonError::PermissionDenied(format!(
            "{permission_id} requires approval"
        )))
    }

    pub fn grant(
        &self,
        agent_id: &str,
        permission_id: &str,
        scope: Option<String>,
        session_only: bool,
    ) -> AvalonResult<GrantedPermission> {
        let def = self
            .catalog
            .read()
            .get(permission_id)
            .cloned()
            .ok_or_else(|| AvalonError::InvalidArgument(permission_id.into()))?;
        if def.default_policy == ApprovalPolicy::Deny && permission_id == "shell.raw" {
            return Err(AvalonError::PermissionDenied(
                "cannot grant raw shell".into(),
            ));
        }
        let grant = GrantedPermission {
            grant_id: Uuid::new_v4().to_string(),
            agent_id: agent_id.to_string(),
            permission_id: permission_id.to_string(),
            scope,
            risk_level: def.risk_level,
            approval_policy: ApprovalPolicy::Auto,
            expires_at: None,
            session_only,
        };
        if session_only {
            self.session_grants.write().insert(grant.grant_id.clone());
        }
        self.grants
            .write()
            .entry(agent_id.to_string())
            .or_default()
            .push(grant.clone());
        let _ = self.audit.append(
            "user",
            "permission.grant",
            permission_id,
            "OK",
            None,
            Some(serde_json::json!({"agent": agent_id})),
        );
        Ok(grant)
    }

    pub fn request_approval(&self, req: ApprovalRequest) -> AvalonResult<String> {
        let id = req.request_id.clone();
        self.pending.write().insert(id.clone(), req);
        Ok(id)
    }

    pub fn decide(
        &self,
        request_id: &str,
        decision: ApprovalDecision,
    ) -> AvalonResult<()> {
        let req = self
            .pending
            .write()
            .remove(request_id)
            .ok_or_else(|| AvalonError::NotFound(request_id.into()))?;
        match decision {
            ApprovalDecision::Deny => {
                let _ = self.audit.append(
                    &req.agent_id,
                    "security.permission.denied",
                    &req.resource,
                    "DENIED",
                    None,
                    None,
                );
                Ok(())
            }
            ApprovalDecision::AllowOnce | ApprovalDecision::AllowForSession => {
                self.grant(
                    &req.agent_id,
                    &req.action,
                    req.scope,
                    decision == ApprovalDecision::AllowForSession
                        || decision == ApprovalDecision::AllowOnce,
                )?;
                Ok(())
            }
            ApprovalDecision::AlwaysAllowScoped => {
                self.grant(&req.agent_id, &req.action, req.scope, false)?;
                Ok(())
            }
        }
    }

    pub fn list_grants(&self, agent_id: &str) -> Vec<GrantedPermission> {
        self.grants
            .read()
            .get(agent_id)
            .cloned()
            .unwrap_or_default()
    }

    pub fn catalog(&self) -> Vec<PermissionDef> {
        self.catalog.read().values().cloned().collect()
    }

    pub fn pending_approvals(&self) -> Vec<ApprovalRequest> {
        self.pending.read().values().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn deny_by_default_and_grant() {
        let dir = tempdir().unwrap();
        let audit = Arc::new(AuditLedger::open(dir.path().join("a.jsonl")).unwrap());
        let engine = PermissionEngine::new(audit);
        assert!(engine.check("macro-x", "network.api.fred", None).is_err());
        engine
            .grant("macro-x", "network.api.fred", None, false)
            .unwrap();
        assert!(engine.check("macro-x", "network.api.fred", None).is_ok());
        assert!(engine.check("macro-x", "shell.raw", None).is_err());
    }
}
