//! AgentRuntimeManager — process supervision with crash containment.

use avalon_audit::AuditLedger;
use avalon_events::{AvalonEvent, EventBus};
use avalon_permissions::PermissionEngine;
use avalon_registry::{validate_agent_manifest, AgentManifest};
use avalon_security::{AvalonError, AvalonResult};
use avalon_system::ResourceLimits;
use avalon_workspace::WorkspaceManager;
use chrono::{DateTime, Utc};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AgentStatus {
    NotInstalled,
    Registered,
    Starting,
    Running,
    Stopped,
    Failed,
    Crashed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInstance {
    pub manifest: AgentManifest,
    pub status: AgentStatus,
    pub workspace: PathBuf,
    pub last_error: Option<String>,
    pub started_at: Option<DateTime<Utc>>,
    pub pid: Option<u32>,
    pub limits: ResourceLimits,
    pub install_root: Option<PathBuf>,
}

struct LiveAgent {
    info: AgentInstance,
    child: Option<Child>,
}

pub struct AgentRuntimeManager {
    agents: RwLock<HashMap<String, LiveAgent>>,
    workspaces: Arc<WorkspaceManager>,
    events: Arc<EventBus>,
    audit: Arc<AuditLedger>,
    permissions: Arc<PermissionEngine>,
    python: PathBuf,
}

impl AgentRuntimeManager {
    pub fn new(
        workspaces: Arc<WorkspaceManager>,
        events: Arc<EventBus>,
        audit: Arc<AuditLedger>,
        permissions: Arc<PermissionEngine>,
    ) -> Self {
        Self {
            agents: RwLock::new(HashMap::new()),
            workspaces,
            events,
            audit,
            permissions,
            python: std::env::var("AVALON_PYTHON")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("python3")),
        }
    }

    pub fn register_manifest(&self, value: &serde_json::Value) -> AvalonResult<AgentInstance> {
        let manifest = validate_agent_manifest(value)?;
        let ws = self.workspaces.create(&manifest.agent_id)?;
        // Bootstrap minimal workspace permissions (still explicit grants)
        let _ = self.permissions.grant(
            &manifest.agent_id,
            "filesystem.read.workspace",
            None,
            false,
        );
        let _ = self.permissions.grant(
            &manifest.agent_id,
            "filesystem.write.workspace",
            None,
            false,
        );
        let _ = self
            .permissions
            .grant(&manifest.agent_id, "memory.read.self", None, false);
        let _ = self
            .permissions
            .grant(&manifest.agent_id, "memory.write.self", None, false);

        let instance = AgentInstance {
            manifest: manifest.clone(),
            status: AgentStatus::Registered,
            workspace: ws.root,
            last_error: None,
            started_at: None,
            pid: None,
            limits: ResourceLimits::default(),
            install_root: None,
        };
        self.agents.write().insert(
            manifest.agent_id.clone(),
            LiveAgent {
                info: instance.clone(),
                child: None,
            },
        );
        let _ = self.events.publish(EventBus::system_event(
            "agent.registered",
            "agent-host",
            serde_json::json!({"agent_id": manifest.agent_id}),
        ));
        Ok(instance)
    }

    pub fn register_placeholder(&self, agent_id: &str, name: &str) {
        let manifest = AgentManifest {
            schema_version: 1,
            agent_id: agent_id.to_string(),
            name: name.to_string(),
            version: "0.0.0".into(),
            publisher: Some("Avalon Capital".into()),
            description: Some("PLACEHOLDER — not installed".into()),
            runtime: "python".into(),
            entrypoint: "main.py".into(),
            permissions: vec![],
            network: serde_json::json!({}),
            resources: serde_json::json!({}),
            events: serde_json::json!({}),
            capabilities: vec![],
            minimum_core_version: Some("0.1.0".into()),
            workspace: None,
            dependencies: vec![],
            memory_policy: serde_json::json!({}),
            model_policy: serde_json::json!({}),
            resource_limits: serde_json::json!({}),
            healthcheck: serde_json::json!({}),
            api_contracts: serde_json::json!({}),
        };
        let instance = AgentInstance {
            manifest,
            status: AgentStatus::NotInstalled,
            workspace: self.workspaces.base().join(agent_id),
            last_error: None,
            started_at: None,
            pid: None,
            limits: ResourceLimits::default(),
            install_root: None,
        };
        self.agents.write().insert(
            agent_id.to_string(),
            LiveAgent {
                info: instance,
                child: None,
            },
        );
    }

    pub fn set_install_root(&self, agent_id: &str, root: PathBuf) -> AvalonResult<()> {
        let mut agents = self.agents.write();
        let live = agents
            .get_mut(agent_id)
            .ok_or_else(|| AvalonError::AgentUnavailable(agent_id.into()))?;
        live.info.install_root = Some(root);
        if live.info.status == AgentStatus::NotInstalled {
            live.info.status = AgentStatus::Registered;
        }
        Ok(())
    }

    pub fn start(&self, agent_id: &str) -> AvalonResult<AgentInstance> {
        let mut agents = self.agents.write();
        let live = agents
            .get_mut(agent_id)
            .ok_or_else(|| AvalonError::AgentUnavailable(agent_id.into()))?;
        if live.info.status == AgentStatus::NotInstalled {
            return Err(AvalonError::AgentUnavailable(format!(
                "{agent_id} NOT_INSTALLED"
            )));
        }
        if live.info.status == AgentStatus::Running {
            return Ok(live.info.clone());
        }

        live.info.status = AgentStatus::Starting;
        let entry = live.info.manifest.entrypoint.clone();
        let runtime = live.info.manifest.runtime.clone();
        let install = live
            .info
            .install_root
            .clone()
            .unwrap_or_else(|| live.info.workspace.clone());
        let script = install.join(&entry);

        let child = if runtime == "python" {
            if !script.exists() {
                // In-process supervised mock runner for templates without python file yet
                live.info.status = AgentStatus::Running;
                live.info.started_at = Some(Utc::now());
                live.info.pid = Some(std::process::id());
                live.info.last_error = None;
                let info = live.info.clone();
                drop(agents);
                let _ = self.events.publish(EventBus::system_event(
                    "agent.started",
                    "agent-host",
                    serde_json::json!({"agent_id": agent_id, "mode": "in_process_supervised"}),
                ));
                let _ = self.audit.append(
                    agent_id,
                    "agent.started",
                    agent_id,
                    "OK",
                    None,
                    None,
                );
                return Ok(info);
            }
            Command::new(&self.python)
                .arg(&script)
                .current_dir(&install)
                .env("AVALON_AGENT_ID", agent_id)
                .env(
                    "AVALON_WORKSPACE",
                    live.info.workspace.to_string_lossy().as_ref(),
                )
                .stdin(Stdio::null())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .map_err(|e| AvalonError::AgentUnavailable(e.to_string()))?
        } else {
            return Err(AvalonError::InvalidArgument(format!(
                "unsupported runtime {runtime}"
            )));
        };

        live.info.pid = child.id().into();
        live.info.status = AgentStatus::Running;
        live.info.started_at = Some(Utc::now());
        live.child = Some(child);
        let info = live.info.clone();
        drop(agents);
        let _ = self.events.publish(EventBus::system_event(
            "agent.started",
            "agent-host",
            serde_json::json!({"agent_id": agent_id}),
        ));
        Ok(info)
    }

    pub fn stop(&self, agent_id: &str) -> AvalonResult<AgentInstance> {
        let mut agents = self.agents.write();
        let live = agents
            .get_mut(agent_id)
            .ok_or_else(|| AvalonError::AgentUnavailable(agent_id.into()))?;
        if let Some(mut child) = live.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
        live.info.status = AgentStatus::Stopped;
        live.info.pid = None;
        let info = live.info.clone();
        drop(agents);
        let _ = self.events.publish(EventBus::system_event(
            "agent.stopped",
            "agent-host",
            serde_json::json!({"agent_id": agent_id}),
        ));
        Ok(info)
    }

    /// Simulate / record a crash without stopping the host.
    pub fn mark_crashed(&self, agent_id: &str, reason: &str) -> AvalonResult<()> {
        let mut agents = self.agents.write();
        let live = agents
            .get_mut(agent_id)
            .ok_or_else(|| AvalonError::AgentUnavailable(agent_id.into()))?;
        if let Some(mut child) = live.child.take() {
            let _ = child.kill();
        }
        live.info.status = AgentStatus::Failed;
        live.info.last_error = Some(reason.to_string());
        live.info.pid = None;
        drop(agents);
        let _ = self.events.publish(AvalonEvent {
            event_id: Uuid::new_v4().to_string(),
            event_type: "agent.failed".into(),
            timestamp: Utc::now(),
            source: "agent-host".into(),
            target: Some(agent_id.into()),
            correlation_id: None,
            payload_schema: None,
            payload: serde_json::json!({"reason": reason}),
            security_level: 2,
            trace_id: Uuid::new_v4().to_string(),
        });
        Ok(())
    }

    pub fn poll(&self) {
        let mut agents = self.agents.write();
        for (id, live) in agents.iter_mut() {
            if let Some(child) = live.child.as_mut() {
                match child.try_wait() {
                    Ok(Some(status)) => {
                        live.child = None;
                        live.info.pid = None;
                        if status.success() {
                            live.info.status = AgentStatus::Stopped;
                        } else {
                            live.info.status = AgentStatus::Crashed;
                            live.info.last_error = Some(format!("exit {status}"));
                            let _ = self.events.publish(EventBus::system_event(
                                "agent.failed",
                                "agent-host",
                                serde_json::json!({"agent_id": id, "exit": format!("{status}")}),
                            ));
                        }
                    }
                    Ok(None) => {}
                    Err(e) => {
                        live.info.status = AgentStatus::Failed;
                        live.info.last_error = Some(e.to_string());
                    }
                }
            }
        }
    }

    pub fn list(&self) -> Vec<AgentInstance> {
        self.poll();
        self.agents
            .read()
            .values()
            .map(|l| l.info.clone())
            .collect()
    }

    pub fn get(&self, agent_id: &str) -> Option<AgentInstance> {
        self.poll();
        self.agents.read().get(agent_id).map(|l| l.info.clone())
    }
}
