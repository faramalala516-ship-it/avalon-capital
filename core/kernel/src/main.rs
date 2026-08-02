use avalon_kernel::{serve_local_api, AvalonCoreKernel, KernelConfig};
use avalon_security::NetworkMode;
use clap::{Parser, Subcommand};
use std::path::PathBuf;
use std::sync::Arc;

#[derive(Parser, Debug)]
#[command(name = "avalon-core", version, about = "Avalon Agentique Platform Core")]
struct Cli {
    #[arg(long)]
    data_dir: Option<PathBuf>,

    #[arg(long, default_value = "false")]
    dev: bool,

    #[arg(long, default_value = "8741")]
    api_port: u16,

    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Start kernel + local API
    Serve,
    /// Print platform status JSON
    Status,
    /// Run self-check / smoke validation
    SelfTest,
    /// Agent package operations (Codex / operators)
    Agents {
        #[command(subcommand)]
        command: AgentCommands,
    },
}

#[derive(Subcommand, Debug)]
enum AgentCommands {
    /// Install an agent package directory containing avalon-agent.json
    Install {
        /// Path to agent package root (e.g. agents/codex-drop/macro-x)
        path: PathBuf,
    },
    /// List registered agents
    List,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let filter = if cli.dev {
        "info,avalon_kernel=debug"
    } else {
        "info"
    };
    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .json()
        .init();

    if cli.dev {
        tracing::warn!("AVALON_DEV_MODE active — development diagnostics enabled");
    }

    let config = KernelConfig {
        data_dir: cli.data_dir,
        network_mode: NetworkMode::OfflineLock,
        bind_api: true,
        api_port: cli.api_port,
        dev_mode: cli.dev,
    };

    let kernel = AvalonCoreKernel::bootstrap(config)?;

    match cli.command.unwrap_or(Commands::Serve) {
        Commands::Serve => {
            let k = kernel.clone();
            let port = cli.api_port;
            tokio::select! {
                r = serve_local_api(k.clone(), port) => {
                    r.map_err(|e| anyhow::anyhow!(e))?;
                }
                _ = tokio::signal::ctrl_c() => {
                    tracing::info!("shutdown signal");
                }
            }
            kernel.shutdown()?;
        }
        Commands::Status => {
            println!("{}", serde_json::to_string_pretty(&kernel.platform_status())?);
            kernel.shutdown()?;
        }
        Commands::SelfTest => {
            run_self_test(kernel.clone()).await?;
            kernel.shutdown()?;
        }
        Commands::Agents { command } => match command {
            AgentCommands::Install { path } => {
                let report = kernel.agents.install_from_dir(&path)?;
                println!("{}", serde_json::to_string_pretty(&report)?);
                kernel.shutdown()?;
            }
            AgentCommands::List => {
                println!("{}", serde_json::to_string_pretty(&kernel.agents.list())?);
                kernel.shutdown()?;
            }
        },
    }
    Ok(())
}

async fn run_self_test(kernel: Arc<AvalonCoreKernel>) -> anyhow::Result<()> {
    let status = kernel.platform_status();
    assert!(status.vault_unlocked);
    assert!(kernel.db.on_disk_is_not_plaintext_sqlite()?);

    // Register hello agent
    let manifest = serde_json::json!({
        "schema_version": 1,
        "agent_id": "hello-avalon",
        "name": "HelloAvalonAgent",
        "version": "0.1.0",
        "runtime": "python",
        "entrypoint": "main.py",
        "permissions": ["filesystem.read.workspace"]
    });
    kernel.agents.register_manifest(&manifest)?;
    kernel.agents.start("hello-avalon")?;
    assert_eq!(
        kernel.agents.get("hello-avalon").unwrap().status,
        avalon_agent_host::AgentStatus::Running
    );
    kernel.agents.mark_crashed("hello-avalon", "self-test crash")?;
    assert!(matches!(
        kernel.agents.get("hello-avalon").unwrap().status,
        avalon_agent_host::AgentStatus::Failed
    ));
    // Core still running
    assert!(kernel.state.read().running);

    // Malicious requests denied
    assert!(kernel
        .permissions
        .check("hello-avalon", "shell.raw", None)
        .is_err());
    kernel.set_network_mode(NetworkMode::OfflineLock);
    assert!(kernel
        .network
        .authorize(&avalon_network::NetworkRequest {
            agent_id: "hello-avalon".into(),
            provider_id: "fred".into(),
            method: "GET".into(),
            path: "/".into(),
            parameters: serde_json::json!({}),
        })
        .is_err());

    let secret = kernel.create_secret("test", "self-test", "plaintext-should-not-persist")?;
    let vault_bytes = std::fs::read(kernel.paths.secure_dir.join("vault.bin"))?;
    assert!(!String::from_utf8_lossy(&vault_bytes).contains("plaintext-should-not-persist"));
    let _ = secret;

    println!("SELF_TEST_PASS");
    Ok(())
}
