//! Security adversarial integration tests for Avalon Core.

use avalon_agent_host::AgentStatus;
use avalon_kernel::{AvalonCoreKernel, KernelConfig};
use avalon_network::NetworkRequest;
use avalon_privilege_broker::{reject_raw_shell, PrivilegeRequest};
use avalon_security::{NetworkMode, SecretBytes};
use std::sync::Arc;
use tempfile::tempdir;

fn boot() -> Arc<AvalonCoreKernel> {
    let dir = tempdir().unwrap();
    // leak dir for process lifetime of test — use into_path
    let path = dir.keep();
    AvalonCoreKernel::bootstrap(KernelConfig {
        data_dir: Some(path),
        network_mode: NetworkMode::OfflineLock,
        bind_api: false,
        api_port: 8741,
        dev_mode: true,
    })
    .unwrap()
}

#[test]
fn acceptance_b_vault_no_plaintext() {
    let k = boot();
    let meta = k
        .create_secret("test", "acceptance-b", "TOP-SECRET-VALUE-XYZ")
        .unwrap();
    let raw = std::fs::read(k.paths.secure_dir.join("vault.bin")).unwrap();
    assert!(!String::from_utf8_lossy(&raw).contains("TOP-SECRET-VALUE-XYZ"));
    assert!(meta.configured);
    // UI-facing list has no values
    for s in k.vault.list_meta() {
        let encoded = serde_json::to_string(&s).unwrap();
        assert!(!encoded.contains("TOP-SECRET-VALUE-XYZ"));
    }
    k.shutdown().unwrap();
}

#[test]
fn acceptance_c_malicious_agent_denied() {
    let k = boot();
    let m = serde_json::json!({
        "schema_version": 1,
        "agent_id": "malicious",
        "name": "Mal",
        "version": "0.0.1",
        "runtime": "python",
        "entrypoint": "main.py"
    });
    k.agents.register_manifest(&m).unwrap();
    assert!(k.permissions.check("malicious", "shell.raw", None).is_err());
    assert!(k
        .workspaces
        .resolve("malicious", "../../Windows/System32")
        .is_err());
    k.set_network_mode(NetworkMode::Online);
    // even online, unknown arbitrary destination via mismatched host denied
    let err = k.network.authorize(&NetworkRequest {
        agent_id: "malicious".into(),
        provider_id: "fred".into(),
        method: "GET".into(),
        path: "https://evil.example/".into(),
        parameters: serde_json::json!({}),
    });
    assert!(err.is_err());
    let denied = k.audit.query(Some("malicious"), None, Some("DENIED"), 50).unwrap();
    assert!(!denied.is_empty());
    k.shutdown().unwrap();
}

#[test]
fn acceptance_d_workspace_isolation() {
    let k = boot();
    for id in ["agent-a", "agent-b"] {
        let m = serde_json::json!({
            "schema_version": 1,
            "agent_id": id,
            "name": id,
            "version": "0.1.0",
            "runtime": "python",
            "entrypoint": "main.py"
        });
        k.agents.register_manifest(&m).unwrap();
    }
    // Agent A cannot resolve into B by traversal
    assert!(k
        .workspaces
        .resolve("agent-a", "../agent-b/output/secret.txt")
        .is_err());
    k.shutdown().unwrap();
}

fn install_template(k: &AvalonCoreKernel, relative: &str) {
    let root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../agents/templates")
        .join(relative)
        .canonicalize()
        .expect("agent template path");
    k.agents.install_from_dir(&root).expect("install template");
}

#[test]
fn acceptance_e_offline_lock() {
    let k = boot();
    k.set_network_mode(NetworkMode::OfflineLock);
    install_template(&k, "hello-avalon");
    k.agents.start("hello-avalon").unwrap();
    assert!(k
        .network
        .authorize(&NetworkRequest {
            agent_id: "hello-avalon".into(),
            provider_id: "fred".into(),
            method: "GET".into(),
            path: "/".into(),
            parameters: serde_json::json!({}),
        })
        .is_err());
    k.shutdown().unwrap();
}

#[test]
fn acceptance_f_agent_crash_core_alive() {
    let k = boot();
    install_template(&k, "hello-avalon");
    k.agents.start("hello-avalon").unwrap();
    k.agents.mark_crashed("hello-avalon", "boom").unwrap();
    assert!(matches!(
        k.agents.get("hello-avalon").unwrap().status,
        AgentStatus::Failed
    ));
    assert!(k.state.read().running);
    k.agents.start("hello-avalon").unwrap();
    k.shutdown().unwrap();
}

#[test]
fn acceptance_g_db_theft() {
    let k = boot();
    k.db.seal().unwrap();
    assert!(k.db.on_disk_is_not_plaintext_sqlite().unwrap());
    let raw = std::fs::read(k.db.sealed_path()).unwrap();
    assert!(!raw.starts_with(b"SQLite format 3"));
    k.shutdown().unwrap();
}

#[test]
fn acceptance_h_audit_tamper() {
    let k = boot();
    k.audit
        .append("kernel", "test.action", "res", "OK", None, None)
        .unwrap();
    let path = k.audit.path().to_path_buf();
    let mut s = std::fs::read_to_string(&path).unwrap();
    s = s.replace("test.action", "test.tampered");
    std::fs::write(&path, s).unwrap();
    assert!(k.audit.verify().is_err());
    k.shutdown().unwrap();
}

#[test]
fn acceptance_i_permission_ask_deny() {
    let k = boot();
    let m = serde_json::json!({
        "schema_version": 1,
        "agent_id": "ask-agent",
        "name": "Ask",
        "version": "0.1.0",
        "runtime": "python",
        "entrypoint": "main.py"
    });
    k.agents.register_manifest(&m).unwrap();
    let req = avalon_permissions::ApprovalRequest {
        request_id: "req-1".into(),
        agent_id: "ask-agent".into(),
        action: "network.api.fred".into(),
        reason: "sync".into(),
        scope: None,
        resource: "fred".into(),
        risk_level: avalon_security::RiskLevel::ExternalAccess,
        expires_at: chrono::Utc::now() + chrono::Duration::minutes(5),
    };
    k.permissions.request_approval(req).unwrap();
    k.permissions
        .decide("req-1", avalon_permissions::ApprovalDecision::Deny)
        .unwrap();
    assert!(k.permissions.check("ask-agent", "network.api.fred", None).is_err());
    k.shutdown().unwrap();
}

#[test]
fn acceptance_j_macro_x_contract() {
    let k = boot();
    install_template(&k, "macro-x-mock");
    k.agents.start("macro-x").unwrap();
    k.events
        .publish(avalon_events::EventBus::system_event(
            "macro.regime.changed",
            "agent:macro-x",
            serde_json::json!({"regime": "UNKNOWN"}),
        ))
        .unwrap();
    k.permissions
        .grant("macro-x", "network.api.fred", None, false)
        .unwrap();
    // offline still denies network
    assert!(k
        .network
        .authorize(&NetworkRequest {
            agent_id: "macro-x".into(),
            provider_id: "fred".into(),
            method: "GET".into(),
            path: "/fred".into(),
            parameters: serde_json::json!({}),
        })
        .is_err());
    k.agents.stop("macro-x").unwrap();
    k.shutdown().unwrap();
}

#[test]
fn privilege_broker_rejects_raw_and_unauthorized() {
    let k = boot();
    assert!(reject_raw_shell("powershell").is_err());
    assert!(k
        .privilege
        .execute(
            "x",
            PrivilegeRequest::RestartAvalonService {
                service_id: "avalon-core".into()
            }
        )
        .is_err());
    k.shutdown().unwrap();
}

#[test]
fn invalid_manifest_rejected() {
    let k = boot();
    let bad = serde_json::json!({
        "schema_version": 99,
        "agent_id": "x",
        "name": "x",
        "version": "1",
        "runtime": "python",
        "entrypoint": "main.py"
    });
    assert!(k.agents.register_manifest(&bad).is_err());
    k.shutdown().unwrap();
}

#[test]
fn unknown_plugin_untrusted_no_perms() {
    let k = boot();
    k.plugins
        .register(avalon_registry::PluginRecord {
            plugin_id: "weird".into(),
            kind: avalon_registry::PluginKind::Tool,
            version: "0.0.1".into(),
            publisher: None,
            capabilities: vec!["x".into()],
            permissions: vec!["system.admin.install".into()],
            hash: None,
            signature: None,
            dependencies: vec![],
            trust: avalon_registry::PluginTrust::Trusted,
            health: "unknown".into(),
            manifest: serde_json::json!({}),
        })
        .unwrap();
    let p = k.plugins.get("weird").unwrap();
    assert_eq!(p.trust, avalon_registry::PluginTrust::Untrusted);
    assert!(p.permissions.is_empty());
    k.shutdown().unwrap();
}

#[test]
fn backup_restore_roundtrip() {
    let k = boot();
    k.db.seal().unwrap();
    let (path, _manifest) = k
        .backups
        .backup(&k.paths.data_dir, avalon_system::VERSION)
        .unwrap();
    k.backups.verify(&path).unwrap();
    let dry = k.backups.restore_dry_run(&path).unwrap();
    assert!(dry["dry_run"].as_bool().unwrap());
    let out = k.paths.cache_dir.join("restore-test");
    k.backups.restore(&path, &out).unwrap();
    k.shutdown().unwrap();
}

#[test]
fn secrets_not_in_frontend_dto() {
    let k = boot();
    let _ = k
        .vault
        .create(
            "p",
            "l",
            &SecretBytes::new(b"never-in-dto".to_vec()),
        )
        .unwrap();
    let dto = serde_json::to_string(&k.platform_status()).unwrap();
    assert!(!dto.contains("never-in-dto"));
    k.shutdown().unwrap();
}
