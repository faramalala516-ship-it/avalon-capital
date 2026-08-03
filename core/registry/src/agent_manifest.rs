use avalon_security::{AvalonError, AvalonResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;

pub const AGENT_SCHEMA_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentManifest {
    pub schema_version: u32,
    pub agent_id: String,
    pub name: String,
    pub version: String,
    #[serde(default)]
    pub publisher: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    pub runtime: String,
    pub entrypoint: String,
    #[serde(default)]
    pub permissions: Vec<String>,
    #[serde(default)]
    pub network: Value,
    #[serde(default)]
    pub resources: Value,
    #[serde(default)]
    pub events: Value,
    #[serde(default)]
    pub capabilities: Vec<String>,
    #[serde(default)]
    pub minimum_core_version: Option<String>,
    #[serde(default)]
    pub workspace: Option<String>,
    #[serde(default)]
    pub dependencies: Vec<String>,
    #[serde(default)]
    pub memory_policy: Value,
    #[serde(default)]
    pub model_policy: Value,
    #[serde(default)]
    pub resource_limits: Value,
    #[serde(default)]
    pub healthcheck: Value,
    #[serde(default)]
    pub api_contracts: Value,
    /// `oneshot` (default) or `daemon` — daemon agents are supervised/restarted if they exit.
    #[serde(default)]
    pub lifecycle: Option<String>,
}

const AGENT_SCHEMA: &str = r#"{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["schema_version", "agent_id", "name", "version", "runtime", "entrypoint"],
  "properties": {
    "schema_version": { "type": "integer", "minimum": 1, "maximum": 1 },
    "agent_id": { "type": "string", "minLength": 1, "pattern": "^[a-z0-9][a-z0-9_-]*$" },
    "name": { "type": "string", "minLength": 1 },
    "version": { "type": "string", "minLength": 1 },
    "publisher": { "type": "string" },
    "description": { "type": "string" },
    "runtime": { "type": "string", "enum": ["python", "native"] },
    "entrypoint": { "type": "string", "minLength": 1 },
    "permissions": { "type": "array", "items": { "type": "string" } },
    "network": { "type": "object" },
    "resources": { "type": "object" },
    "events": { "type": "object" },
    "capabilities": { "type": "array", "items": { "type": "string" } },
    "minimum_core_version": { "type": "string" },
    "workspace": { "type": "string" },
    "dependencies": { "type": "array", "items": { "type": "string" } },
    "memory_policy": { "type": "object" },
    "model_policy": { "type": "object" },
    "resource_limits": { "type": "object" },
    "healthcheck": { "type": "object" },
    "api_contracts": { "type": "object" },
    "lifecycle": { "type": "string", "enum": ["oneshot", "daemon", "long_running"] }
  },
  "additionalProperties": true
}"#;

pub fn validate_agent_manifest(value: &Value) -> AvalonResult<AgentManifest> {
    let schema: Value = serde_json::from_str(AGENT_SCHEMA)
        .map_err(|e| AvalonError::Internal(e.to_string()))?;
    let validator = jsonschema::validator_for(&schema)
        .map_err(|e| AvalonError::Internal(format!("schema compile: {e}")))?;
    if let Err(err) = validator.validate(value) {
        return Err(AvalonError::InvalidManifest(err.to_string()));
    }
    let manifest: AgentManifest = serde_json::from_value(value.clone())
        .map_err(|e| AvalonError::InvalidManifest(e.to_string()))?;
    if manifest.schema_version != AGENT_SCHEMA_VERSION {
        return Err(AvalonError::VersionMismatch(format!(
            "unsupported schema_version {}",
            manifest.schema_version
        )));
    }
    Ok(manifest)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_incompatible_schema() {
        let v = serde_json::json!({
            "schema_version": 99,
            "agent_id": "x",
            "name": "X",
            "version": "0.1.0",
            "runtime": "python",
            "entrypoint": "main.py"
        });
        assert!(validate_agent_manifest(&v).is_err());
    }

    #[test]
    fn accepts_valid_manifest() {
        let v = serde_json::json!({
            "schema_version": 1,
            "agent_id": "macro-x",
            "name": "Macro-X",
            "version": "0.1.0",
            "runtime": "python",
            "entrypoint": "main.py",
            "permissions": ["filesystem.read.workspace"]
        });
        let m = validate_agent_manifest(&v).unwrap();
        assert_eq!(m.agent_id, "macro-x");
    }
}
