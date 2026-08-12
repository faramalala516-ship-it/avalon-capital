use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolRecord {
    pub tool_id: String,
    pub version: String,
    pub owner: String,
    pub description: String,
    pub input_schema: serde_json::Value,
    pub output_schema: serde_json::Value,
    pub permissions: Vec<String>,
    pub risk_level: u8,
    pub timeout_ms: u64,
    pub deterministic: bool,
}

pub struct ToolRegistry {
    tools: RwLock<HashMap<String, ToolRecord>>,
}

impl ToolRegistry {
    pub fn new() -> Self {
        let reg = Self {
            tools: RwLock::new(HashMap::new()),
        };
        reg.seed();
        reg
    }

    fn seed(&self) {
        let seeds = [
            ("excel.create_workbook", "Create workbook", 1, true),
            ("excel.update_sheet", "Update sheet", 1, true),
            ("chart.create", "Create chart", 1, true),
            ("filesystem.read", "Read file in scope", 0, true),
            ("macro.get_series", "Get macro series", 2, true),
            ("market.get_bars", "Get market bars", 2, true),
            ("application.open", "Open registered app", 3, true),
            ("document.export_pdf", "Export PDF", 1, true),
        ];
        let mut map = self.tools.write();
        for (id, desc, risk, det) in seeds {
            map.insert(
                id.to_string(),
                ToolRecord {
                    tool_id: id.to_string(),
                    version: "1.0.0".into(),
                    owner: "avalon-core".into(),
                    description: desc.into(),
                    input_schema: serde_json::json!({"type":"object"}),
                    output_schema: serde_json::json!({"type":"object"}),
                    permissions: vec![],
                    risk_level: risk,
                    timeout_ms: 30_000,
                    deterministic: det,
                },
            );
        }
    }

    pub fn get(&self, tool_id: &str) -> Option<ToolRecord> {
        self.tools.read().get(tool_id).cloned()
    }

    pub fn list(&self) -> Vec<ToolRecord> {
        self.tools.read().values().cloned().collect()
    }

    pub fn register(&self, tool: ToolRecord) {
        self.tools.write().insert(tool.tool_id.clone(), tool);
    }
}

impl Default for ToolRegistry {
    fn default() -> Self {
        Self::new()
    }
}
