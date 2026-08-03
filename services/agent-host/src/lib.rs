//! AgentRuntimeManager — process supervision, crash containment, package install.

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
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInstallReport {
    pub agent_id: String,
    pub version: String,
    pub install_root: PathBuf,
    pub files_copied: usize,
    pub permissions_granted: Vec<String>,
    pub permissions_skipped: Vec<String>,
    pub hashes_file: PathBuf,
    pub source: PathBuf,
}

struct LiveAgent {
    info: AgentInstance,
    child: Option<Child>,
}

#[derive(Debug, Clone)]
struct PythonLaunch {
    program: PathBuf,
    prefix_args: Vec<String>,
}

fn resolve_python_launch() -> PythonLaunch {
    if let Ok(p) = std::env::var("AVALON_PYTHON") {
        return PythonLaunch {
            program: PathBuf::from(p),
            prefix_args: vec![],
        };
    }

    #[cfg(windows)]
    let probes: Vec<(&str, Vec<String>)> = vec![
        ("py", vec!["-3".into()]),
        ("python", vec![]),
        ("python3", vec![]),
    ];
    #[cfg(not(windows))]
    let probes: Vec<(&str, Vec<String>)> = vec![("python3", vec![]), ("python", vec![])];

    for (prog, args) in &probes {
        let mut cmd = Command::new(prog);
        for a in args {
            cmd.arg(a);
        }
        cmd.arg("-c").arg("import sys; print(sys.version)");
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x0800_0000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }
        if cmd
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
        {
            return PythonLaunch {
                program: PathBuf::from(prog),
                prefix_args: args.clone(),
            };
        }
    }

    #[cfg(windows)]
    {
        PythonLaunch {
            program: PathBuf::from("python"),
            prefix_args: vec![],
        }
    }
    #[cfg(not(windows))]
    {
        PythonLaunch {
            program: PathBuf::from("python3"),
            prefix_args: vec![],
        }
    }
}

pub struct AgentRuntimeManager {
    agents: RwLock<HashMap<String, LiveAgent>>,
    workspaces: Arc<WorkspaceManager>,
    events: Arc<EventBus>,
    audit: Arc<AuditLedger>,
    permissions: Arc<PermissionEngine>,
    python: PythonLaunch,
    installed_root: PathBuf,
    api_base: String,
    api_token_file: Option<PathBuf>,
}

fn is_forbidden_permission(permission_id: &str) -> bool {
    permission_id == "shell.raw"
        || permission_id.contains("powershell")
        || permission_id.contains("cmd.exe")
}

fn should_skip_copy(path: &Path) -> bool {
    let name = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    matches!(
        name.as_str(),
        ".git" | "__pycache__" | ".pytest_cache" | "node_modules" | ".ds_store" | "thumbs.db"
    ) || name.ends_with(".pyc")
}

fn copy_agent_tree(src: &Path, dst: &Path, hashes: &mut Vec<(String, String)>) -> AvalonResult<usize> {
    let mut count = 0usize;
    fs::create_dir_all(dst).map_err(|e| AvalonError::Internal(e.to_string()))?;
    for entry in fs::read_dir(src).map_err(|e| AvalonError::Internal(e.to_string()))? {
        let entry = entry.map_err(|e| AvalonError::Internal(e.to_string()))?;
        let path = entry.path();
        if should_skip_copy(&path) {
            continue;
        }
        let rel = path
            .strip_prefix(src)
            .map_err(|e| AvalonError::Internal(e.to_string()))?;
        let target = dst.join(rel);
        if path.is_dir() {
            count += copy_agent_tree(&path, &target, hashes)?;
        } else if path.is_file() {
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent).map_err(|e| AvalonError::Internal(e.to_string()))?;
            }
            fs::copy(&path, &target).map_err(|e| AvalonError::Internal(e.to_string()))?;
            let mut file = fs::File::open(&target).map_err(|e| AvalonError::Internal(e.to_string()))?;
            let mut hasher = Sha256::new();
            let mut buf = [0u8; 8192];
            loop {
                let n = file.read(&mut buf).map_err(|e| AvalonError::Internal(e.to_string()))?;
                if n == 0 {
                    break;
                }
                hasher.update(&buf[..n]);
            }
            let digest = hasher
                .finalize()
                .iter()
                .map(|b| format!("{b:02x}"))
                .collect::<String>();
            hashes.push((rel.to_string_lossy().replace('\\', "/"), digest));
            count += 1;
        }
    }
    Ok(count)
}

impl AgentRuntimeManager {
    pub fn new(
        workspaces: Arc<WorkspaceManager>,
        events: Arc<EventBus>,
        audit: Arc<AuditLedger>,
        permissions: Arc<PermissionEngine>,
        installed_root: PathBuf,
    ) -> Self {
        let _ = fs::create_dir_all(&installed_root);
        Self {
            agents: RwLock::new(HashMap::new()),
            workspaces,
            events,
            audit,
            permissions,
            python: resolve_python_launch(),
            installed_root,
            api_base: std::env::var("AVALON_API_BASE")
                .unwrap_or_else(|_| "http://127.0.0.1:8741".into()),
            api_token_file: None,
        }
    }

    pub fn with_api_context(mut self, api_base: String, token_file: Option<PathBuf>) -> Self {
        self.api_base = api_base;
        self.api_token_file = token_file;
        self
    }

    pub fn register_manifest(&self, value: &serde_json::Value) -> AvalonResult<AgentInstance> {
        let manifest = validate_agent_manifest(value)?;
        let ws = self.workspaces.create(&manifest.agent_id)?;
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

    /// Install an agent package from a directory containing `avalon-agent.json`.
    /// Copies into `{installed_root}/{agent_id}/{version}/`, validates, grants declared permissions,
    /// writes `HASHES.sha256`, and registers the agent. Codex drops Macro-X here.
    pub fn install_from_dir(&self, source: &Path) -> AvalonResult<AgentInstallReport> {
        let source = source
            .canonicalize()
            .map_err(|e| AvalonError::InvalidArgument(format!("agent source: {e}")))?;
        let manifest_path = source.join("avalon-agent.json");
        if !manifest_path.is_file() {
            return Err(AvalonError::InvalidManifest(
                "avalon-agent.json missing in package root".into(),
            ));
        }
        let raw = fs::read_to_string(&manifest_path)
            .map_err(|e| AvalonError::InvalidManifest(e.to_string()))?;
        let value: serde_json::Value =
            serde_json::from_str(&raw).map_err(|e| AvalonError::InvalidManifest(e.to_string()))?;
        let preview = validate_agent_manifest(&value)?;

        for perm in &preview.permissions {
            if is_forbidden_permission(perm) {
                return Err(AvalonError::PermissionDenied(format!(
                    "agent manifest requests forbidden permission: {perm}"
                )));
            }
        }

        let entry = source.join(&preview.entrypoint);
        if !entry.is_file() {
            return Err(AvalonError::InvalidManifest(format!(
                "entrypoint missing: {}",
                preview.entrypoint
            )));
        }

        let dest = self
            .installed_root
            .join(&preview.agent_id)
            .join(&preview.version);
        if dest.exists() {
            fs::remove_dir_all(&dest).map_err(|e| AvalonError::Internal(e.to_string()))?;
        }
        let mut hashes = Vec::new();
        let files_copied = copy_agent_tree(&source, &dest, &mut hashes)?;
        hashes.sort_by(|a, b| a.0.cmp(&b.0));
        let hashes_file = dest.join("HASHES.sha256");
        let mut hashes_body = String::new();
        for (rel, digest) in &hashes {
            hashes_body.push_str(&format!("{digest}  {rel}\n"));
        }
        fs::write(&hashes_file, hashes_body).map_err(|e| AvalonError::Internal(e.to_string()))?;

        // Stop running instance if replacing
        if self.agents.read().contains_key(&preview.agent_id) {
            let _ = self.stop(&preview.agent_id);
        }

        let instance = self.register_manifest(&value)?;
        let mut granted = Vec::new();
        let mut skipped = Vec::new();
        for perm in &instance.manifest.permissions {
            if matches!(
                perm.as_str(),
                "filesystem.read.workspace"
                    | "filesystem.write.workspace"
                    | "memory.read.self"
                    | "memory.write.self"
            ) {
                granted.push(perm.clone());
                continue;
            }
            match self
                .permissions
                .grant(&instance.manifest.agent_id, perm, None, false)
            {
                Ok(_) => granted.push(perm.clone()),
                Err(_) => skipped.push(perm.clone()),
            }
        }
        self.set_install_root(&instance.manifest.agent_id, dest.clone())?;

        let report = AgentInstallReport {
            agent_id: instance.manifest.agent_id.clone(),
            version: instance.manifest.version.clone(),
            install_root: dest,
            files_copied,
            permissions_granted: granted,
            permissions_skipped: skipped,
            hashes_file,
            source,
        };
        let _ = self.events.publish(EventBus::system_event(
            "agent.installed",
            "agent-host",
            serde_json::json!({
                "agent_id": report.agent_id,
                "version": report.version,
                "files": report.files_copied
            }),
        ));
        let _ = self.audit.append(
            &report.agent_id,
            "agent.installed",
            &report.agent_id,
            "OK",
            None,
            Some(serde_json::json!({
                "version": report.version,
                "source": report.source,
                "install_root": report.install_root
            })),
        );
        Ok(report)
    }

    /// Try candidates in order; first valid package wins.
    pub fn install_first_available(&self, candidates: &[PathBuf]) -> AvalonResult<AgentInstallReport> {
        let mut last = AvalonError::InvalidArgument("no agent package candidates".into());
        for path in candidates {
            if path.join("avalon-agent.json").is_file() {
                match self.install_from_dir(path) {
                    Ok(r) => return Ok(r),
                    Err(e) => last = e,
                }
            }
        }
        Err(last)
    }

    /// Re-bind packages already copied under `installed_root` (survives process restart).
    /// Layout expected: `{agents_dir}/{agent_id}/{version}/avalon-agent.json`
    /// Skips drop-zone dirs like `incoming/` so they never overwrite a real install_root.
    pub fn discover_installed(&self) -> AvalonResult<usize> {
        if !self.installed_root.is_dir() {
            return Ok(0);
        }
        let mut bound = 0usize;
        let agent_dirs = fs::read_dir(&self.installed_root)
            .map_err(|e| AvalonError::Internal(e.to_string()))?;
        for agent_entry in agent_dirs {
            let agent_path = agent_entry
                .map_err(|e| AvalonError::Internal(e.to_string()))?
                .path();
            if !agent_path.is_dir() {
                continue;
            }
            let top = agent_path
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_ascii_lowercase();
            // Never treat the Windows drop zone / caches as installed packages
            if matches!(top.as_str(), "incoming" | "cache" | "tmp" | "staging") {
                continue;
            }
            let mut versions: Vec<PathBuf> = fs::read_dir(&agent_path)
                .map_err(|e| AvalonError::Internal(e.to_string()))?
                .filter_map(|e| e.ok())
                .map(|e| e.path())
                .filter(|p| p.is_dir() && p.join("avalon-agent.json").is_file())
                .collect();
            versions.sort();
            let Some(latest) = versions.pop() else {
                continue;
            };
            let raw = fs::read_to_string(latest.join("avalon-agent.json"))
                .map_err(|e| AvalonError::InvalidManifest(e.to_string()))?;
            let value: serde_json::Value = serde_json::from_str(&raw)
                .map_err(|e| AvalonError::InvalidManifest(e.to_string()))?;
            let instance = self.register_manifest(&value)?;
            for perm in &instance.manifest.permissions {
                if is_forbidden_permission(perm) {
                    continue;
                }
                let _ = self
                    .permissions
                    .grant(&instance.manifest.agent_id, perm, None, false);
            }
            self.set_install_root(&instance.manifest.agent_id, latest)?;
            bound += 1;
        }
        Ok(bound)
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
        let workspace = live.info.workspace.clone();
        let api_base = self.api_base.clone();
        let token_file = self.api_token_file.clone();

        let child = if runtime == "python" {
            if !script.exists() {
                let msg = format!(
                    "entrypoint missing: {} (install_root={})",
                    script.display(),
                    install.display()
                );
                live.info.status = AgentStatus::Failed;
                live.info.last_error = Some(msg.clone());
                live.info.pid = None;
                return Err(AvalonError::AgentUnavailable(msg));
            }
            let mut cmd = Command::new(&self.python.program);
            for a in &self.python.prefix_args {
                cmd.arg(a);
            }
            cmd.arg(&script)
                .current_dir(&install)
                .env("AVALON_AGENT_ID", agent_id)
                .env("AVALON_WORKSPACE", workspace.to_string_lossy().as_ref())
                .env("AVALON_API_BASE", &api_base)
                .stdin(Stdio::null())
                // Avoid pipe-buffer deadlock: agents persist outputs in workspace files
                .stdout(Stdio::null())
                .stderr(Stdio::piped());
            if let Some(tf) = token_file {
                cmd.env("AVALON_API_TOKEN_FILE", tf);
            }
            // Prefer vendored SDK inside the installed agent package (Windows-safe)
            let mut python_paths = Vec::new();
            let vendor = install.join("vendor");
            if vendor.is_dir() {
                python_paths.push(vendor.to_string_lossy().to_string());
            }
            if let Ok(sdk) = std::env::var("AVALON_PYTHONPATH") {
                python_paths.push(sdk);
            }
            if !python_paths.is_empty() {
                let joined = python_paths.join(if cfg!(windows) { ";" } else { ":" });
                cmd.env("PYTHONPATH", joined);
            }
            #[cfg(windows)]
            {
                use std::os::windows::process::CommandExt;
                const CREATE_NO_WINDOW: u32 = 0x0800_0000;
                cmd.creation_flags(CREATE_NO_WINDOW);
            }
            match cmd.spawn() {
                Ok(child) => child,
                Err(e) => {
                    let msg = format!(
                        "Python launch failed ({} {:?}): {e}. Install Python 3 and ensure `py -3` or `python` works.",
                        self.python.program.display(),
                        self.python.prefix_args
                    );
                    live.info.status = AgentStatus::Failed;
                    live.info.last_error = Some(msg.clone());
                    live.info.pid = None;
                    return Err(AvalonError::AgentUnavailable(msg));
                }
            }
        } else {
            live.info.status = AgentStatus::Failed;
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

#[cfg(test)]
mod tests {
    use super::*;
    use avalon_audit::AuditLedger;
    use avalon_events::EventBus;
    use avalon_permissions::PermissionEngine;
    use avalon_workspace::WorkspaceManager;
    use std::sync::Arc;
    use tempfile::tempdir;

    #[test]
    fn install_from_dir_copies_and_registers() {
        let tmp = tempdir().unwrap();
        let ws = Arc::new(WorkspaceManager::new(tmp.path().join("ws")).unwrap());
        let audit = Arc::new(AuditLedger::open(tmp.path().join("audit.jsonl")).unwrap());
        let perms = Arc::new(PermissionEngine::new(audit.clone()));
        let events = Arc::new(EventBus::new(100));
        let host = AgentRuntimeManager::new(
            ws,
            events,
            audit,
            perms,
            tmp.path().join("installed"),
        );

        let pkg = tmp.path().join("pkg");
        fs::create_dir_all(&pkg).unwrap();
        fs::write(
            pkg.join("avalon-agent.json"),
            r#"{
              "schema_version": 1,
              "agent_id": "macro-x",
              "name": "Macro-X",
              "version": "1.0.0",
              "runtime": "python",
              "entrypoint": "main.py",
              "permissions": ["filesystem.read.workspace", "network.api.fred"]
            }"#,
        )
        .unwrap();
        fs::write(pkg.join("main.py"), "print('ok')\n").unwrap();

        let report = host.install_from_dir(&pkg).unwrap();
        assert_eq!(report.agent_id, "macro-x");
        assert!(report.install_root.join("main.py").exists());
        assert!(report.hashes_file.exists());
        let agent = host.get("macro-x").unwrap();
        assert_eq!(agent.status, AgentStatus::Registered);
        assert!(agent.install_root.is_some());
    }

    #[test]
    fn install_rejects_shell_raw() {
        let tmp = tempdir().unwrap();
        let ws = Arc::new(WorkspaceManager::new(tmp.path().join("ws")).unwrap());
        let audit = Arc::new(AuditLedger::open(tmp.path().join("audit.jsonl")).unwrap());
        let perms = Arc::new(PermissionEngine::new(audit.clone()));
        let events = Arc::new(EventBus::new(100));
        let host = AgentRuntimeManager::new(
            ws,
            events,
            audit,
            perms,
            tmp.path().join("installed"),
        );
        let pkg = tmp.path().join("bad");
        fs::create_dir_all(&pkg).unwrap();
        fs::write(
            pkg.join("avalon-agent.json"),
            r#"{
              "schema_version": 1,
              "agent_id": "evil",
              "name": "Evil",
              "version": "0.1.0",
              "runtime": "python",
              "entrypoint": "main.py",
              "permissions": ["shell.raw"]
            }"#,
        )
        .unwrap();
        fs::write(pkg.join("main.py"), "print(1)\n").unwrap();
        assert!(host.install_from_dir(&pkg).is_err());
    }
}
