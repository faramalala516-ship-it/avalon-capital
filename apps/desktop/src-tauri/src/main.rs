#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use avalon_agent_host::AgentStatus;
use avalon_kernel::{serve_local_api, AvalonCoreKernel, KernelConfig};
use avalon_security::NetworkMode;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;
use tauri::{Manager, State};

struct AppState {
    kernel: Arc<AvalonCoreKernel>,
    agents_search_roots: Vec<PathBuf>,
}

#[tauri::command]
fn platform_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    serde_json::to_value(state.kernel.platform_status()).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_agents(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    serde_json::to_value(state.kernel.agents.list()).map_err(|e| e.to_string())
}

#[tauri::command]
fn start_agent(state: State<'_, AppState>, id: String) -> Result<serde_json::Value, String> {
    let a = state.kernel.agents.start(&id).map_err(|e| e.to_string())?;
    serde_json::to_value(a).map_err(|e| e.to_string())
}

#[tauri::command]
fn stop_agent(state: State<'_, AppState>, id: String) -> Result<serde_json::Value, String> {
    let a = state.kernel.agents.stop(&id).map_err(|e| e.to_string())?;
    serde_json::to_value(a).map_err(|e| e.to_string())
}

#[tauri::command]
fn install_agent(state: State<'_, AppState>, path: String) -> Result<serde_json::Value, String> {
    let report = state
        .kernel
        .agents
        .install_from_dir(PathBuf::from(path).as_path())
        .map_err(|e| e.to_string())?;
    serde_json::to_value(report).map_err(|e| e.to_string())
}

/// Install from bundled resources / Codex drop / LocalAppData incoming.
#[tauri::command]
fn install_agent_preferred(
    state: State<'_, AppState>,
    id: String,
) -> Result<serde_json::Value, String> {
    let candidates = preferred_candidates(&state.agents_search_roots, &state.kernel, &id);
    let report = state
        .kernel
        .agents
        .install_first_available(&candidates)
        .map_err(|e| {
            format!(
                "{e}. Chemins sondés: {}",
                candidates
                    .iter()
                    .map(|p| p.display().to_string())
                    .collect::<Vec<_>>()
                    .join(" | ")
            )
        })?;
    // Keep Macro-X up after an intentional upgrade.
    if id == "macro-x" {
        let _ = state.kernel.agents.start("macro-x");
    }
    serde_json::to_value(report).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_events(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    serde_json::to_value(state.kernel.events.recent(100)).map_err(|e| e.to_string())
}

#[tauri::command]
fn security_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let st = state.kernel.platform_status();
    Ok(serde_json::json!({
        "security_status": st.security_status,
        "vault_unlocked": st.vault_unlocked,
        "network_mode": st.network_mode,
        "root_key_provider": st.root_key_provider
    }))
}

#[tauri::command]
fn set_network_mode(state: State<'_, AppState>, mode: NetworkMode) -> Result<serde_json::Value, String> {
    state.kernel.set_network_mode(mode);
    Ok(serde_json::json!({ "mode": mode }))
}

#[tauri::command]
fn matrix(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    Ok(state.kernel.matrix())
}

#[tauri::command]
fn complete_first_run(state: State<'_, AppState>) -> Result<(), String> {
    let marker = state.kernel.paths.data_dir.join(".first_run_complete");
    std::fs::write(marker, b"1").map_err(|e| e.to_string())
}

fn agents_repo_root() -> PathBuf {
    // CARGO_MANIFEST_DIR = apps/desktop/src-tauri → ../../../agents = repo/agents
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../../agents")
}

fn push_agents_root(roots: &mut Vec<PathBuf>, path: PathBuf) {
    if path.is_dir() && !roots.iter().any(|r| r == &path) {
        roots.push(path);
    }
}

/// Collect every plausible location for bundled/dev agent packages.
fn collect_agent_search_roots(resource_dir: Option<&Path>) -> Vec<PathBuf> {
    let mut roots = Vec::new();

    if let Some(res) = resource_dir {
        // Prefer remapped layout: $RESOURCE/agents/... (tauri.conf map)
        push_agents_root(&mut roots, res.join("agents"));
        // Legacy list layout: $RESOURCE/resources/agents/...
        push_agents_root(&mut roots, res.join("resources").join("agents"));
        // Parent-dir rewrite used by Tauri for ../ patterns
        push_agents_root(&mut roots, res.join("_up_").join("agents"));
        push_agents_root(
            &mut roots,
            res.join("_up_").join("resources").join("agents"),
        );
        // Sometimes resources sit next to the executable on Windows
        if let Some(exe_parent) = res.parent() {
            push_agents_root(&mut roots, exe_parent.join("agents"));
            push_agents_root(&mut roots, exe_parent.join("resources").join("agents"));
        }
    }

    // Dev / CI checkout
    push_agents_root(&mut roots, agents_repo_root());
    // build.rs output tree (useful in tauri dev before bundle)
    push_agents_root(
        &mut roots,
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources/agents"),
    );

    roots
}

fn preferred_candidates(
    search_roots: &[PathBuf],
    kernel: &AvalonCoreKernel,
    id: &str,
) -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    for root in search_roots {
        // Production Codex drop first
        candidates.push(root.join("codex-drop").join(id));
        candidates.push(root.join(id));
        candidates.push(root.join("templates").join(id));
        // Mock templates last (dev/acceptance only)
        candidates.push(root.join("templates").join(format!("{id}-mock")));
    }
    candidates.push(kernel.paths.agents_dir.join("incoming").join(id));
    candidates
}

fn bootstrap_agents(kernel: &AvalonCoreKernel, search_roots: &[PathBuf]) {
    tracing::info!(
        "agent search roots: {}",
        search_roots
            .iter()
            .map(|p| p.display().to_string())
            .collect::<Vec<_>>()
            .join(" | ")
    );

    let macro_candidates = preferred_candidates(search_roots, kernel, "macro-x");
    match kernel.agents.install_first_available(&macro_candidates) {
        Ok(report) => {
            tracing::info!(
                "Macro-X installed from {} → v{}",
                report.source.display(),
                report.version
            );
            match kernel.agents.start("macro-x") {
                Ok(inst) => tracing::info!("Macro-X auto-start: {:?}", inst.status),
                Err(e) => tracing::warn!("Macro-X auto-start failed: {e}"),
            }
        }
        Err(e) => {
            tracing::warn!("Macro-X bundled install failed: {e}");
            // Never bind the oneshot mock as production Macro-X in release builds.
            #[cfg(debug_assertions)]
            {
                let mock = agents_repo_root().join("templates/macro-x-mock");
                if mock.join("avalon-agent.json").is_file() {
                    if let Ok(raw) = std::fs::read_to_string(mock.join("avalon-agent.json")) {
                        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&raw) {
                            let _ = kernel.agents.register_manifest(&v);
                            let _ = kernel.agents.set_install_root("macro-x", mock);
                        }
                    }
                }
            }
            // If a previous install exists, still try to keep the daemon up.
            if let Some(existing) = kernel.agents.get("macro-x") {
                if existing.status != AgentStatus::NotInstalled {
                    let _ = kernel.agents.start("macro-x");
                }
            }
        }
    }

    // Hello Avalon demo package
    let mut hello = preferred_candidates(search_roots, kernel, "hello-avalon");
    for root in search_roots {
        hello.insert(0, root.join("templates/hello-avalon"));
    }
    let _ = kernel.agents.install_first_available(&hello);
}

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter("info")
        .init();

    let api_port: u16 = 8741;
    let kernel = AvalonCoreKernel::bootstrap(KernelConfig {
        data_dir: None,
        network_mode: NetworkMode::OfflineLock,
        bind_api: true,
        api_port,
        dev_mode: cfg!(debug_assertions),
    })
    .expect("failed to bootstrap Avalon Core");

    // Start local authenticated API so agents can call Core (token file written here)
    let api_kernel = kernel.clone();
    std::thread::spawn(move || {
        let rt = tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .expect("tokio runtime for Avalon API");
        if let Err(e) = rt.block_on(serve_local_api(api_kernel, api_port)) {
            tracing::error!("Avalon local API exited: {e}");
        }
    });

    // Host supervisor: keep daemon agents alive even if UI polling changes later.
    let supervise = kernel.clone();
    std::thread::spawn(move || loop {
        supervise.agents.poll();
        std::thread::sleep(Duration::from_secs(2));
    });

    // Brief wait so api.token exists before first agent start from UI
    std::thread::sleep(Duration::from_millis(500));

    tauri::Builder::default()
        .setup(move |app| {
            let resource_dir = app.path().resource_dir().ok();
            if let Some(ref res) = resource_dir {
                tracing::info!("Tauri resource_dir={}", res.display());
            }
            let search_roots = collect_agent_search_roots(resource_dir.as_deref());
            bootstrap_agents(&kernel, &search_roots);
            app.manage(AppState {
                kernel: kernel.clone(),
                agents_search_roots: search_roots,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            platform_status,
            list_agents,
            start_agent,
            stop_agent,
            install_agent,
            install_agent_preferred,
            list_events,
            security_status,
            set_network_mode,
            matrix,
            complete_first_run
        ])
        .build(tauri::generate_context!())
        .expect("error building Avalon desktop")
        .run(|app, event| {
            if matches!(
                event,
                tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit
            ) {
                if let Some(state) = app.try_state::<AppState>() {
                    tracing::info!("stopping all agents on desktop exit");
                    state.kernel.agents.stop_all();
                }
            }
        });
}
