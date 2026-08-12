//! AvalonPrivilegeBroker — typed privileged operations only. No raw shell.

use avalon_audit::AuditLedger;
use avalon_permissions::PermissionEngine;
use avalon_registry::ApplicationRegistry;
use avalon_security::{AvalonError, AvalonResult};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "op", rename_all = "snake_case")]
pub enum PrivilegeRequest {
    RestartAvalonService { service_id: String },
    InstallApprovedPackage {
        package_id: String,
        expected_hash: String,
    },
    OpenApplication { application_id: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivilegeResult {
    pub request_id: String,
    pub status: String,
    pub detail: String,
}

pub struct PrivilegeBroker {
    permissions: Arc<PermissionEngine>,
    audit: Arc<AuditLedger>,
    apps: Arc<ApplicationRegistry>,
    approved_packages: parking_lot::RwLock<std::collections::HashMap<String, String>>,
}

impl PrivilegeBroker {
    pub fn new(
        permissions: Arc<PermissionEngine>,
        audit: Arc<AuditLedger>,
        apps: Arc<ApplicationRegistry>,
    ) -> Self {
        Self {
            permissions,
            audit,
            apps,
            approved_packages: parking_lot::RwLock::new(std::collections::HashMap::new()),
        }
    }

    pub fn approve_package(&self, package_id: &str, hash: &str) {
        self.approved_packages
            .write()
            .insert(package_id.to_string(), hash.to_string());
    }

    pub fn execute(&self, agent_id: &str, req: PrivilegeRequest) -> AvalonResult<PrivilegeResult> {
        let request_id = Uuid::new_v4().to_string();
        match &req {
            PrivilegeRequest::RestartAvalonService { service_id } => {
                self.permissions
                    .check(agent_id, "system.service.restart", Some(service_id))?;
                validate_service_id(service_id)?;
                let _ = self.audit.append(
                    agent_id,
                    "privilege.restart_service",
                    service_id,
                    "OK",
                    Some(&request_id),
                    None,
                );
                Ok(PrivilegeResult {
                    request_id,
                    status: "ACCEPTED".into(),
                    detail: format!("restart queued for service {service_id}"),
                })
            }
            PrivilegeRequest::InstallApprovedPackage {
                package_id,
                expected_hash,
            } => {
                self.permissions
                    .check(agent_id, "system.admin.install", Some(package_id))?;
                let approved = self.approved_packages.read();
                let Some(hash) = approved.get(package_id) else {
                    let _ = self.audit.append(
                        agent_id,
                        "privilege.install",
                        package_id,
                        "DENIED",
                        Some(&request_id),
                        Some(serde_json::json!({"reason": "package not approved"})),
                    );
                    return Err(AvalonError::PermissionDenied(
                        "package not in approved set".into(),
                    ));
                };
                if hash != expected_hash {
                    let _ = self.audit.append(
                        agent_id,
                        "privilege.install",
                        package_id,
                        "DENIED",
                        Some(&request_id),
                        Some(serde_json::json!({"reason": "hash mismatch"})),
                    );
                    return Err(AvalonError::SecurityViolation(
                        "package hash mismatch".into(),
                    ));
                }
                Ok(PrivilegeResult {
                    request_id,
                    status: "ACCEPTED".into(),
                    detail: format!("install authorized for {package_id}"),
                })
            }
            PrivilegeRequest::OpenApplication { application_id } => {
                self.permissions
                    .check(agent_id, "process.launch.allowed", Some(application_id))?;
                let app = self
                    .apps
                    .get(application_id)
                    .ok_or_else(|| AvalonError::NotFound(format!("application {application_id}")))?;
                if app.path.is_empty() {
                    return Err(AvalonError::DataUnavailable(format!(
                        "application {application_id} path not configured"
                    )));
                }
                let _ = self.audit.append(
                    agent_id,
                    "privilege.open_application",
                    application_id,
                    "OK",
                    Some(&request_id),
                    None,
                );
                Ok(PrivilegeResult {
                    request_id,
                    status: "ACCEPTED".into(),
                    detail: format!("open authorized for {application_id}"),
                })
            }
        }
    }
}

fn validate_service_id(service_id: &str) -> AvalonResult<()> {
    if service_id.is_empty()
        || service_id.contains(' ')
        || service_id.contains(';')
        || service_id.contains('|')
        || service_id.contains('&')
    {
        return Err(AvalonError::InvalidArgument(
            "invalid service_id — injection characters rejected".into(),
        ));
    }
    if !service_id.starts_with("avalon-") {
        return Err(AvalonError::PermissionDenied(
            "only avalon-* services may be restarted".into(),
        ));
    }
    Ok(())
}

pub fn reject_raw_shell(_command: &str) -> AvalonResult<()> {
    Err(AvalonError::PermissionDenied(
        "raw admin shell APIs do not exist and are forbidden".into(),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn unauthorized_restart_denied() {
        let dir = tempdir().unwrap();
        let audit = Arc::new(AuditLedger::open(dir.path().join("a.jsonl")).unwrap());
        let perms = Arc::new(PermissionEngine::new(audit.clone()));
        let apps = Arc::new(ApplicationRegistry::new());
        let broker = PrivilegeBroker::new(perms, audit.clone(), apps);
        let err = broker
            .execute(
                "evil-agent",
                PrivilegeRequest::RestartAvalonService {
                    service_id: "avalon-core".into(),
                },
            )
            .unwrap_err();
        assert!(matches!(err, AvalonError::PermissionDenied(_)));
        let entries = audit.query(Some("evil"), None, Some("DENIED"), 10).unwrap();
        assert!(!entries.is_empty());
    }

    #[test]
    fn injection_service_id_rejected() {
        let dir = tempdir().unwrap();
        let audit = Arc::new(AuditLedger::open(dir.path().join("a.jsonl")).unwrap());
        let perms = Arc::new(PermissionEngine::new(audit.clone()));
        perms
            .grant("a", "system.service.restart", None, false)
            .unwrap();
        let apps = Arc::new(ApplicationRegistry::new());
        let broker = PrivilegeBroker::new(perms, audit, apps);
        assert!(broker
            .execute(
                "a",
                PrivilegeRequest::RestartAvalonService {
                    service_id: "avalon-core; powershell".into(),
                },
            )
            .is_err());
    }

    #[test]
    fn raw_shell_rejected() {
        assert!(reject_raw_shell("powershell -Command Get-Process").is_err());
    }
}
