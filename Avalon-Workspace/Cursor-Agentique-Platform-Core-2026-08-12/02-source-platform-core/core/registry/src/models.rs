use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelRecord {
    pub provider: String,
    pub model_id: String,
    pub display_name: String,
    pub context_window: u32,
    pub tool_support: bool,
    pub structured_output: bool,
    pub embedding: bool,
    pub local: bool,
    pub memory_requirement_mb: u32,
    pub status: String,
}

pub struct ModelRegistry {
    models: RwLock<HashMap<String, ModelRecord>>,
}

impl ModelRegistry {
    pub fn new() -> Self {
        let s = Self {
            models: RwLock::new(HashMap::new()),
        };
        s.register(ModelRecord {
            provider: "ollama".into(),
            model_id: "ollama/llama3.2".into(),
            display_name: "Llama 3.2 (Ollama)".into(),
            context_window: 8192,
            tool_support: true,
            structured_output: true,
            embedding: false,
            local: true,
            memory_requirement_mb: 4096,
            status: "NOT_CONFIGURED".into(),
        });
        s.register(ModelRecord {
            provider: "llama.cpp".into(),
            model_id: "llamacpp/local".into(),
            display_name: "llama.cpp server".into(),
            context_window: 4096,
            tool_support: false,
            structured_output: true,
            embedding: false,
            local: true,
            memory_requirement_mb: 4096,
            status: "NOT_CONFIGURED".into(),
        });
        s
    }

    pub fn register(&self, model: ModelRecord) {
        self.models
            .write()
            .insert(model.model_id.clone(), model);
    }

    pub fn list(&self) -> Vec<ModelRecord> {
        self.models.read().values().cloned().collect()
    }

    pub fn set_status(&self, model_id: &str, status: &str) {
        if let Some(m) = self.models.write().get_mut(model_id) {
            m.status = status.to_string();
        }
    }
}

impl Default for ModelRegistry {
    fn default() -> Self {
        Self::new()
    }
}
