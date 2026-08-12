//! Agent, tool, model, application, and prompt registries.

mod agent_manifest;
mod apps;
mod models;
mod plugins;
mod prompts;
mod tools;

pub use agent_manifest::{validate_agent_manifest, AgentManifest, AGENT_SCHEMA_VERSION};
pub use apps::{ApplicationRecord, ApplicationRegistry};
pub use models::{ModelRecord, ModelRegistry};
pub use plugins::{PluginKind, PluginRecord, PluginRegistry, PluginTrust};
pub use prompts::{PromptRecord, PromptRegistry};
pub use tools::{ToolRecord, ToolRegistry};
