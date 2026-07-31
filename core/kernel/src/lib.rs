//! AvalonCoreKernel — startup, lifecycle, registries, health. No Macro-X business logic.

mod backup;
mod api;
mod state;

pub use backup::{BackupManager, BackupManifest};
pub use state::{KernelConfig, PlatformState};

use avalon_agent_host::AgentRuntimeManager;
use avalon_audit::AuditLedger;
use avalon_data_service::DataCatalog;
use avalon_events::EventBus;
use avalon_ipc::{IpcAuthenticator, ServiceIdentity};
use avalon_llm_gateway::LlmGateway;
use avalon_network::NetworkBroker;
use avalon_permissions::PermissionEngine;
use avalon_privilege_broker::PrivilegeBroker;
use avalon_registry::{
    ApplicationRegistry, ModelRegistry, PluginRegistry, PromptRegistry, ToolRegistry,
};
use avalon_scheduler::Scheduler;
use avalon_security::{
    AvalonError, AvalonResult, KeyDomain, NetworkMode, SecretBytes, SecurityStatus,
};
use avalon_system::{
    aggregate_health, ComponentHealth, CoreHealth, LocalIdentity, PlatformPaths, ResourceGovernor,
    SafeMode, BUILD_NUMBER, VERSION,
};
use avalon_updates::UpdateEngine;
use avalon_vault::{
    default_root_provider, EncryptedCoreDb, KeyRing, SecureVault, CORE_DB_FILENAME,
};
use avalon_workspace::WorkspaceManager;
use chrono::Utc;
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

pub struct AvalonCoreKernel {
    pub paths: PlatformPaths,
    pub config: KernelConfig,
    pub state: RwLock<PlatformState>,
    pub key_ring: Arc<KeyRing>,
    pub vault: Arc<SecureVault>,
    pub db: Arc<EncryptedCoreDb>,
    pub audit: Arc<AuditLedger>,
    pub permissions: Arc<PermissionEngine>,
    pub events: Arc<EventBus>,
    pub network: Arc<NetworkBroker>,
    pub workspaces: Arc<WorkspaceManager>,
    pub agents: Arc<AgentRuntimeManager>,
    pub tools: Arc<ToolRegistry>,
    pub models: Arc<ModelRegistry>,
    pub prompts: Arc<PromptRegistry>,
    pub apps: Arc<ApplicationRegistry>,
    pub plugins: Arc<PluginRegistry>,
    pub privilege: Arc<PrivilegeBroker>,
    pub llm: Arc<LlmGateway>,
    pub data: Arc<DataCatalog>,
    pub scheduler: Arc<Scheduler>,
    pub backups: Arc<BackupManager>,
    pub ipc: Arc<IpcAuthenticator>,
    pub updates: UpdateEngine,
    pub identity: LocalIdentity,
}

impl AvalonCoreKernel {
    pub fn bootstrap(config: KernelConfig) -> AvalonResult<Arc<Self>> {
        let paths = PlatformPaths::resolve(config.data_dir.clone())?;
        let provider = Arc::from(default_root_provider(&paths.secure_dir)?);
        let key_ring = Arc::new(KeyRing::open_or_create(provider, &paths.secure_dir)?);
        let vault = Arc::new(SecureVault::open(
            paths.secure_dir.join("vault.bin"),
            key_ring.clone(),
        )?);
        let db = Arc::new(EncryptedCoreDb::open_or_create(&paths.data_dir, key_ring.clone())?);
        let audit = Arc::new(AuditLedger::open(paths.logs_dir.join("audit.jsonl"))?);
        // Verify audit on startup — fail closed into safe mode if broken
        let mut safe_mode = SafeMode::Normal;
        if let Err(e) = audit.verify() {
            tracing::error!("audit chain invalid: {e}");
            safe_mode = SafeMode::AvalonSafeMode;
        }

        let permissions = Arc::new(PermissionEngine::new(audit.clone()));
        let events = Arc::new(EventBus::new(1000).with_permissions(permissions.clone()));
        let network = Arc::new(NetworkBroker::new(permissions.clone(), audit.clone()));
        network.set_mode(config.network_mode);
        let workspaces = Arc::new(WorkspaceManager::new(&paths.workspace_dir)?);
        let agents = Arc::new(AgentRuntimeManager::new(
            workspaces.clone(),
            events.clone(),
            audit.clone(),
            permissions.clone(),
        ));
        let tools = Arc::new(ToolRegistry::new());
        let models = Arc::new(ModelRegistry::new());
        let prompts = Arc::new(PromptRegistry::new());
        let apps = Arc::new(ApplicationRegistry::new());
        let plugins = Arc::new(PluginRegistry::new());
        let privilege = Arc::new(PrivilegeBroker::new(
            permissions.clone(),
            audit.clone(),
            apps.clone(),
        ));
        let llm = Arc::new(LlmGateway::new(models.clone()));
        let data = Arc::new(DataCatalog::new());
        let scheduler = Arc::new(Scheduler::new());
        let (meta, backup_key) = key_ring.get_active(KeyDomain::Backup)?;
        let backups = Arc::new(BackupManager::new(
            paths.backups_dir.clone(),
            backup_key,
            meta.key_id,
        ));
        let (_, session_key) = key_ring.get_active(KeyDomain::Session)?;
        let ipc = Arc::new(IpcAuthenticator::new(session_key));
        let _tok = ipc.issue(
            &ServiceIdentity {
                service_id: "kernel".into(),
                process_name: "avalon-core".into(),
            },
            3600,
        )?;

        let identity_path = paths.data_dir.join("identity.json");
        let identity = if identity_path.exists() {
            serde_json::from_slice(
                &std::fs::read(&identity_path)
                    .map_err(|e| AvalonError::Internal(e.to_string()))?,
            )
            .map_err(|e| AvalonError::Internal(e.to_string()))?
        } else {
            let id = LocalIdentity {
                identity_id: Uuid::new_v4().to_string(),
                display_name: "Local Avalon User".into(),
                created_at: Utc::now().to_rfc3339(),
            };
            std::fs::write(
                &identity_path,
                serde_json::to_vec_pretty(&id).unwrap_or_default(),
            )
            .ok();
            id
        };

        // Seed prompts from preserved Macro-X IP (contracts only)
        prompts.register(
            "macro-x-system",
            "macro-x",
            "0.1.0",
            include_str!("../../../agents/templates/macro-x-mock/SYSTEM_PROMPT.md"),
            None,
        );

        // Placeholders
        agents.register_placeholder("macro-x", "Macro-X");
        agents.register_placeholder("gem-trade", "Gem-Trade");
        agents.register_placeholder("metaquant-sigma", "MetaQuant Sigma");

        let kernel = Arc::new(Self {
            paths,
            config: config.clone(),
            state: RwLock::new(PlatformState {
                started_at: Utc::now(),
                running: true,
                safe_mode,
                first_run_complete: identity_path.exists(),
                security_status: SecurityStatus::Unknown,
                network_mode: config.network_mode,
                last_backup: None,
                last_data_sync: None,
                warnings: vec![],
            }),
            key_ring,
            vault,
            db,
            audit: audit.clone(),
            permissions,
            events: events.clone(),
            network,
            workspaces,
            agents,
            tools,
            models,
            prompts,
            apps,
            plugins,
            privilege,
            llm,
            data,
            scheduler,
            backups,
            ipc,
            updates: UpdateEngine::default(),
            identity,
        });

        if safe_mode == SafeMode::AvalonSafeMode {
            kernel.enter_safe_mode("audit integrity failure")?;
        }

        let _ = audit.append(
            "kernel",
            "system.started",
            "platform",
            "OK",
            None,
            Some(serde_json::json!({"version": VERSION, "build": BUILD_NUMBER})),
        );
        let _ = events.publish(EventBus::system_event(
            "system.started",
            "kernel",
            serde_json::json!({"version": VERSION}),
        ));

        kernel.refresh_security_status();
        Ok(kernel)
    }

    pub fn enter_safe_mode(&self, reason: &str) -> AvalonResult<()> {
        {
            let mut st = self.state.write();
            st.safe_mode = SafeMode::AvalonSafeMode;
            st.warnings.push(format!("SAFE MODE: {reason}"));
            st.network_mode = NetworkMode::OfflineLock;
        }
        self.network.set_mode(NetworkMode::OfflineLock);
        // Disable third-party plugins / admin / dangerous automations conceptually
        Ok(())
    }

    pub fn refresh_security_status(&self) {
        let vault_ok = self.vault.is_unlocked();
        let db_ok = self.db.on_disk_is_not_plaintext_sqlite().unwrap_or(false);
        let audit_ok = self.audit.verify().is_ok();
        let perms_ok = self.permissions.is_available();
        let status = if !vault_ok {
            SecurityStatus::Locked
        } else if !audit_ok {
            SecurityStatus::CompromisedSuspected
        } else if vault_ok && db_ok && audit_ok && perms_ok {
            SecurityStatus::Secure
        } else {
            SecurityStatus::Degraded
        };
        self.state.write().security_status = status;
    }

    pub fn health(&self) -> CoreHealth {
        self.refresh_security_status();
        let st = self.state.read().clone();
        let components = vec![
            ComponentHealth {
                name: "kernel".into(),
                healthy: st.running,
                detail: "ok".into(),
            },
            ComponentHealth {
                name: "database".into(),
                healthy: self.db.on_disk_is_not_plaintext_sqlite().unwrap_or(false),
                detail: CORE_DB_FILENAME.into(),
            },
            ComponentHealth {
                name: "vault".into(),
                healthy: self.vault.is_unlocked(),
                detail: self.key_ring.provider_name().into(),
            },
            ComponentHealth {
                name: "event_bus".into(),
                healthy: true,
                detail: "ok".into(),
            },
            ComponentHealth {
                name: "agent_host".into(),
                healthy: true,
                detail: format!("{} agents", self.agents.list().len()),
            },
            ComponentHealth {
                name: "network_broker".into(),
                healthy: true,
                detail: format!("{:?}", self.network.mode()),
            },
            ComponentHealth {
                name: "privilege_broker".into(),
                healthy: true,
                detail: "typed-ops-only".into(),
            },
            ComponentHealth {
                name: "scheduler".into(),
                healthy: true,
                detail: format!("{} jobs", self.scheduler.list().len()),
            },
            ComponentHealth {
                name: "llm_gateway".into(),
                healthy: true,
                detail: "local-first".into(),
            },
            ComponentHealth {
                name: "permissions".into(),
                healthy: self.permissions.is_available(),
                detail: "deny-by-default".into(),
            },
            ComponentHealth {
                name: "audit".into(),
                healthy: self.audit.verify().is_ok(),
                detail: "tamper-evident".into(),
            },
        ];
        aggregate_health(components, st.safe_mode)
    }

    pub fn platform_status(&self) -> PlatformStatusDto {
        let health = self.health();
        let st = self.state.read().clone();
        let agents = self.agents.list();
        let resources = ResourceGovernor::snapshot();
        PlatformStatusDto {
            version: VERSION.to_string(),
            build: BUILD_NUMBER.to_string(),
            security_status: st.security_status,
            network_mode: st.network_mode,
            vault_unlocked: self.vault.is_unlocked(),
            safe_mode: st.safe_mode,
            agent_count: agents.len(),
            running_agents: agents
                .iter()
                .filter(|a| a.status == avalon_agent_host::AgentStatus::Running)
                .count(),
            failed_agents: agents
                .iter()
                .filter(|a| {
                    matches!(
                        a.status,
                        avalon_agent_host::AgentStatus::Failed
                            | avalon_agent_host::AgentStatus::Crashed
                    )
                })
                .count(),
            cpu_percent: resources.cpu_percent,
            memory_used_mb: resources.memory_used_mb,
            memory_total_mb: resources.memory_total_mb,
            last_backup: st.last_backup,
            last_data_sync: st.last_data_sync,
            warnings: st.warnings,
            health,
            secrets: self
                .vault
                .list_meta()
                .into_iter()
                .map(|m| SecretMetaDto {
                    secret_id: m.secret_id,
                    provider: m.provider,
                    label: m.label,
                    configured: m.configured,
                })
                .collect(),
            identity_id: self.identity.identity_id.clone(),
            root_key_provider: self.key_ring.provider_name().to_string(),
            updater_enabled: self.updates.enabled,
            automation_policy: avalon_scheduler::Scheduler::note_permission_policy().to_string(),
            first_run_complete: self.paths.data_dir.join(".first_run_complete").exists(),
        }
    }

    pub fn shutdown(&self) -> AvalonResult<()> {
        let _ = self.events.publish(EventBus::system_event(
            "system.stopping",
            "kernel",
            serde_json::json!({}),
        ));
        for agent in self.agents.list() {
            if agent.status == avalon_agent_host::AgentStatus::Running {
                let _ = self.agents.stop(&agent.manifest.agent_id);
            }
        }
        self.db.seal()?;
        self.state.write().running = false;
        let _ = self.audit.append("kernel", "system.stopped", "platform", "OK", None, None);
        Ok(())
    }

    pub fn set_network_mode(&self, mode: NetworkMode) {
        self.network.set_mode(mode);
        self.state.write().network_mode = mode;
    }

    pub fn create_secret(&self, provider: &str, label: &str, value: &str) -> AvalonResult<SecretMetaDto> {
        let meta = self.vault.create(
            provider,
            label,
            &SecretBytes::new(value.as_bytes().to_vec()),
        )?;
        Ok(SecretMetaDto {
            secret_id: meta.secret_id,
            provider: meta.provider,
            label: meta.label,
            configured: meta.configured,
        })
    }

    pub fn matrix(&self) -> serde_json::Value {
        let agents = self.agents.list();
        let connections: Vec<_> = agents
            .iter()
            .filter(|a| a.status != avalon_agent_host::AgentStatus::NotInstalled)
            .map(|a| {
                serde_json::json!({
                    "from": a.manifest.agent_id,
                    "to": "avalon-core",
                    "kind": "agent"
                })
            })
            .collect();
        serde_json::json!({
            "nodes": [
                {"id": "avalon-core", "kind": "core"},
                {"id": "data-service", "kind": "service"},
                {"id": "llm-gateway", "kind": "service"},
                {"id": "excel", "kind": "application"},
                {"id": "macro-x", "kind": "agent"},
                {"id": "gem-trade", "kind": "agent"},
                {"id": "metaquant-sigma", "kind": "agent"}
            ],
            "edges": [
                {"from": "avalon-core", "to": "data-service", "active": true},
                {"from": "avalon-core", "to": "llm-gateway", "active": true},
                {"from": "avalon-core", "to": "excel", "active": self.apps.get("excel").map(|a| !a.path.is_empty()).unwrap_or(false)},
                {"from": "macro-x", "to": "avalon-core", "active": agents.iter().any(|a| a.manifest.agent_id == "macro-x" && a.status == avalon_agent_host::AgentStatus::Running)},
                {"from": "gem-trade", "to": "avalon-core", "active": agents.iter().any(|a| a.manifest.agent_id == "gem-trade" && a.status == avalon_agent_host::AgentStatus::Running)},
                {"from": "metaquant-sigma", "to": "avalon-core", "active": agents.iter().any(|a| a.manifest.agent_id == "metaquant-sigma" && a.status == avalon_agent_host::AgentStatus::Running)}
            ],
            "dynamic": connections
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecretMetaDto {
    pub secret_id: String,
    pub provider: String,
    pub label: String,
    pub configured: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformStatusDto {
    pub version: String,
    pub build: String,
    pub security_status: SecurityStatus,
    pub network_mode: NetworkMode,
    pub vault_unlocked: bool,
    pub safe_mode: SafeMode,
    pub agent_count: usize,
    pub running_agents: usize,
    pub failed_agents: usize,
    pub cpu_percent: f32,
    pub memory_used_mb: u64,
    pub memory_total_mb: u64,
    pub last_backup: Option<String>,
    pub last_data_sync: Option<String>,
    pub warnings: Vec<String>,
    pub health: CoreHealth,
    pub secrets: Vec<SecretMetaDto>,
    pub identity_id: String,
    pub root_key_provider: String,
    pub updater_enabled: bool,
    pub automation_policy: String,
    pub first_run_complete: bool,
}

pub use api::serve_local_api;
