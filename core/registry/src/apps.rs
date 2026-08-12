use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplicationRecord {
    pub application_id: String,
    pub path: String,
    pub publisher: Option<String>,
    pub hash: Option<String>,
    pub permissions: Vec<String>,
    pub launch_policy: String,
}

pub struct ApplicationRegistry {
    apps: RwLock<HashMap<String, ApplicationRecord>>,
}

impl ApplicationRegistry {
    pub fn new() -> Self {
        let s = Self {
            apps: RwLock::new(HashMap::new()),
        };
        // Registered IDs only — paths filled at first-run detection
        for (id, publisher) in [
            ("excel", "Microsoft"),
            ("metatrader5", "MetaQuotes"),
            ("tradingview", "TradingView"),
            ("browser", "System"),
            ("cursor", "Anysphere"),
        ] {
            s.register(ApplicationRecord {
                application_id: id.into(),
                path: String::new(),
                publisher: Some(publisher.into()),
                hash: None,
                permissions: vec!["process.launch.allowed".into()],
                launch_policy: "ASK".into(),
            });
        }
        s
    }

    pub fn register(&self, app: ApplicationRecord) {
        self.apps
            .write()
            .insert(app.application_id.clone(), app);
    }

    pub fn get(&self, id: &str) -> Option<ApplicationRecord> {
        self.apps.read().get(id).cloned()
    }

    pub fn list(&self) -> Vec<ApplicationRecord> {
        self.apps.read().values().cloned().collect()
    }

    pub fn set_path(&self, id: &str, path: &str) {
        if let Some(a) = self.apps.write().get_mut(id) {
            a.path = path.to_string();
        }
    }
}

impl Default for ApplicationRegistry {
    fn default() -> Self {
        Self::new()
    }
}
