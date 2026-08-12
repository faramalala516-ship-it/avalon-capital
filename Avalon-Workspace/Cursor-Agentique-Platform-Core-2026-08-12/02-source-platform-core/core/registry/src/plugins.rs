use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PluginKind {
    Agent,
    DataProvider,
    Tool,
    UiPanel,
    ModelProvider,
    AnalyticsEngine,
    Exporter,
    Connector,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PluginTrust {
    Trusted,
    Untrusted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginRecord {
    pub plugin_id: String,
    pub kind: PluginKind,
    pub version: String,
    pub publisher: Option<String>,
    pub capabilities: Vec<String>,
    pub permissions: Vec<String>,
    pub hash: Option<String>,
    pub signature: Option<String>,
    pub dependencies: Vec<String>,
    pub trust: PluginTrust,
    pub health: String,
    pub manifest: serde_json::Value,
}

pub struct PluginRegistry {
    plugins: RwLock<HashMap<String, PluginRecord>>,
}

impl PluginRegistry {
    pub fn new() -> Self {
        Self {
            plugins: RwLock::new(HashMap::new()),
        }
    }

    pub fn register(&self, mut plugin: PluginRecord) -> Result<(), String> {
        // Unknown plugins are UNTRUSTED and get no automatic permissions
        if plugin.publisher.is_none() && plugin.hash.is_none() {
            plugin.trust = PluginTrust::Untrusted;
            plugin.permissions.clear();
        }
        if plugin.trust == PluginTrust::Untrusted {
            plugin.permissions.clear();
        }
        self.plugins
            .write()
            .insert(plugin.plugin_id.clone(), plugin);
        Ok(())
    }

    pub fn get(&self, id: &str) -> Option<PluginRecord> {
        self.plugins.read().get(id).cloned()
    }

    pub fn list(&self) -> Vec<PluginRecord> {
        self.plugins.read().values().cloned().collect()
    }
}

impl Default for PluginRegistry {
    fn default() -> Self {
        Self::new()
    }
}
