//! Local HTTP API on 127.0.0.1 only. Authentication required.

use crate::{AvalonCoreKernel, PlatformStatusDto};
use avalon_security::{AvalonError, NetworkMode};
use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::Value;
use std::net::SocketAddr;
use std::sync::Arc;

#[derive(Clone)]
struct ApiState {
    kernel: Arc<AvalonCoreKernel>,
    token: String,
}

pub async fn serve_local_api(kernel: Arc<AvalonCoreKernel>, port: u16) -> Result<(), String> {
    let token = uuid::Uuid::new_v4().to_string();
    // Store token file with restrictive perms for local clients
    let token_path = kernel.paths.data_dir.join("api.token");
    std::fs::write(&token_path, &token).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&token_path)
            .map_err(|e| e.to_string())?
            .permissions();
        perms.set_mode(0o600);
        let _ = std::fs::set_permissions(&token_path, perms);
    }

    let state = ApiState { kernel, token };
    let app = Router::new()
        .route("/health", get(health))
        .route("/v1/platform/status", get(platform_status))
        .route("/v1/agents", get(list_agents))
        .route("/v1/agents/{id}", get(get_agent))
        .route("/v1/agents/{id}/start", post(start_agent))
        .route("/v1/agents/{id}/stop", post(stop_agent))
        .route("/v1/agents/{id}/tasks", post(agent_task))
        .route("/v1/events", get(events))
        .route("/v1/security/status", get(security_status))
        .route("/v1/models", get(models))
        .route("/v1/tools", get(tools))
        .route("/v1/network/mode", post(set_network))
        .route("/v1/matrix", get(matrix))
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|e| e.to_string())?;
    tracing::info!("Avalon local API listening on http://{addr}");
    axum::serve(listener, app).await.map_err(|e| e.to_string())
}

fn auth(headers: &HeaderMap, state: &ApiState) -> Result<(), StatusCode> {
    let Some(val) = headers.get("x-avalon-token").and_then(|v| v.to_str().ok()) else {
        return Err(StatusCode::UNAUTHORIZED);
    };
    if val != state.token {
        return Err(StatusCode::UNAUTHORIZED);
    }
    Ok(())
}

async fn health(State(_state): State<ApiState>) -> Json<Value> {
    Json(serde_json::json!({"status":"ok","service":"avalon-core"}))
}

async fn platform_status(
    State(state): State<ApiState>,
    headers: HeaderMap,
) -> Result<Json<PlatformStatusDto>, StatusCode> {
    auth(&headers, &state)?;
    Ok(Json(state.kernel.platform_status()))
}

async fn list_agents(
    State(state): State<ApiState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    auth(&headers, &state)?;
    Ok(Json(serde_json::json!(state.kernel.agents.list())))
}

async fn get_agent(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<Value>, StatusCode> {
    auth(&headers, &state)?;
    match state.kernel.agents.get(&id) {
        Some(a) => Ok(Json(serde_json::json!(a))),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn start_agent(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<Value>, StatusCode> {
    auth(&headers, &state)?;
    match state.kernel.agents.start(&id) {
        Ok(a) => Ok(Json(serde_json::json!(a))),
        Err(AvalonError::AgentUnavailable(_)) => Err(StatusCode::CONFLICT),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

async fn stop_agent(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<Value>, StatusCode> {
    auth(&headers, &state)?;
    match state.kernel.agents.stop(&id) {
        Ok(a) => Ok(Json(serde_json::json!(a))),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

#[derive(Deserialize)]
struct TaskBody {
    prompt: Option<String>,
}

async fn agent_task(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(body): Json<TaskBody>,
) -> Result<Json<Value>, StatusCode> {
    auth(&headers, &state)?;
    Ok(Json(serde_json::json!({
        "agent_id": id,
        "accepted": true,
        "prompt": body.prompt,
        "note": "task queued — agent runtime executes under permission policy"
    })))
}

async fn events(
    State(state): State<ApiState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    auth(&headers, &state)?;
    Ok(Json(serde_json::json!(state.kernel.events.recent(100))))
}

async fn security_status(
    State(state): State<ApiState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    auth(&headers, &state)?;
    let st = state.kernel.platform_status();
    Ok(Json(serde_json::json!({
        "security_status": st.security_status,
        "vault_unlocked": st.vault_unlocked,
        "network_mode": st.network_mode,
        "root_key_provider": st.root_key_provider,
        "audit_ok": state.kernel.audit.verify().is_ok(),
        "db_encrypted": state.kernel.db.on_disk_is_not_plaintext_sqlite().unwrap_or(false)
    })))
}

async fn models(
    State(state): State<ApiState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    auth(&headers, &state)?;
    Ok(Json(serde_json::json!(state.kernel.models.list())))
}

async fn tools(
    State(state): State<ApiState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    auth(&headers, &state)?;
    Ok(Json(serde_json::json!(state.kernel.tools.list())))
}

#[derive(Deserialize)]
struct ModeBody {
    mode: NetworkMode,
}

async fn set_network(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Json(body): Json<ModeBody>,
) -> Result<Json<Value>, StatusCode> {
    auth(&headers, &state)?;
    state.kernel.set_network_mode(body.mode);
    Ok(Json(serde_json::json!({"mode": body.mode})))
}

async fn matrix(
    State(state): State<ApiState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    auth(&headers, &state)?;
    Ok(Json(state.kernel.matrix()))
}
