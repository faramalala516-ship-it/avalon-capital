#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use avalon_kernel::{AvalonCoreKernel, KernelConfig};
use avalon_security::NetworkMode;
use std::sync::Arc;
use tauri::State;

struct AppState {
    kernel: Arc<AvalonCoreKernel>,
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

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter("info")
        .init();

    let kernel = AvalonCoreKernel::bootstrap(KernelConfig {
        data_dir: None,
        network_mode: NetworkMode::OfflineLock,
        bind_api: false,
        api_port: 8741,
        dev_mode: cfg!(debug_assertions),
    })
    .expect("failed to bootstrap Avalon Core");

    let hello = include_str!("../../../../agents/templates/hello-avalon/avalon-agent.json");
    if let Ok(v) = serde_json::from_str::<serde_json::Value>(hello) {
        let _ = kernel.agents.register_manifest(&v);
        let root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../../agents/templates/hello-avalon");
        let _ = kernel.agents.set_install_root("hello-avalon", root);
    }
    let macrox = include_str!("../../../../agents/templates/macro-x-mock/avalon-agent.json");
    if let Ok(v) = serde_json::from_str::<serde_json::Value>(macrox) {
        let _ = kernel.agents.register_manifest(&v);
        let root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../../agents/templates/macro-x-mock");
        let _ = kernel.agents.set_install_root("macro-x", root);
    }

    tauri::Builder::default()
        .manage(AppState {
            kernel: kernel.clone(),
        })
        .invoke_handler(tauri::generate_handler![
            platform_status,
            list_agents,
            start_agent,
            stop_agent,
            list_events,
            security_status,
            set_network_mode,
            matrix,
            complete_first_run
        ])
        .run(tauri::generate_context!())
        .expect("error running Avalon desktop");

    let _ = kernel.shutdown();
}
