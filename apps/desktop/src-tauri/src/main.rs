#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use avalon_kernel::{serve_local_api, AvalonCoreKernel, KernelConfig};
use avalon_security::NetworkMode;
use std::path::PathBuf;
use std::sync::Arc;
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
        .map_err(|e| e.to_string())?;
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

fn preferred_candidates(
    search_roots: &[PathBuf],
    kernel: &AvalonCoreKernel,
    id: &str,
) -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    for root in search_roots {
        candidates.push(root.join("codex-drop").join(id));
        candidates.push(root.join(id));
        candidates.push(root.join("templates").join(format!("{id}-mock")));
        candidates.push(root.join("templates").join(id));
    }
    candidates.push(kernel.paths.agents_dir.join("incoming").join(id));
    candidates
}

fn bootstrap_agents(kernel: &AvalonCoreKernel, search_roots: &[PathBuf]) {
    // Macro-X: prefer Codex/bundled package
    let macro_candidates = preferred_candidates(search_roots, kernel, "macro-x");
    if kernel.agents.install_first_available(&macro_candidates).is_err() {
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

    // Hello Avalon demo package
    let hello_candidates = preferred_candidates(search_roots, kernel, "hello-avalon");
    // templates/hello-avalon is under search roots as templates/hello-avalon
    let mut hello = hello_candidates;
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
    // Brief wait so api.token exists before first agent start from UI
    std::thread::sleep(std::time::Duration::from_millis(500));

    tauri::Builder::default()
        .setup(move |app| {
            let mut search_roots = vec![agents_repo_root()];
            // Bundled resources (NSIS/MSI): resource_dir/agents/...
            if let Ok(res) = app.path().resource_dir() {
                let bundled = res.join("agents");
                if bundled.is_dir() {
                    search_roots.insert(0, bundled);
                }
                // Some Tauri layouts nest resources under _up_
                let nested = res.join("_up_").join("agents");
                if nested.is_dir() {
                    search_roots.insert(0, nested);
                }
            }
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
        .run(tauri::generate_context!())
        .expect("error running Avalon desktop");
}
