use chrono::{DateTime, Utc};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptRecord {
    pub prompt_id: String,
    pub agent: String,
    pub version: String,
    pub hash: String,
    pub created_at: DateTime<Utc>,
    pub active: bool,
    pub previous_version: Option<String>,
    pub body: String,
}

pub struct PromptRegistry {
    prompts: RwLock<HashMap<String, PromptRecord>>,
}

impl PromptRegistry {
    pub fn new() -> Self {
        Self {
            prompts: RwLock::new(HashMap::new()),
        }
    }

    pub fn register(
        &self,
        prompt_id: &str,
        agent: &str,
        version: &str,
        body: &str,
        previous: Option<String>,
    ) -> PromptRecord {
        let hash = hex::encode(Sha256::digest(body.as_bytes()));
        // deactivate previous active for agent
        let mut map = self.prompts.write();
        for p in map.values_mut().filter(|p| p.agent == agent && p.active) {
            p.active = false;
        }
        let rec = PromptRecord {
            prompt_id: prompt_id.to_string(),
            agent: agent.to_string(),
            version: version.to_string(),
            hash,
            created_at: Utc::now(),
            active: true,
            previous_version: previous,
            body: body.to_string(),
        };
        map.insert(format!("{prompt_id}@{version}"), rec.clone());
        rec
    }

    pub fn active_for(&self, agent: &str) -> Option<PromptRecord> {
        self.prompts
            .read()
            .values()
            .find(|p| p.agent == agent && p.active)
            .cloned()
    }
}

impl Default for PromptRegistry {
    fn default() -> Self {
        Self::new()
    }
}
