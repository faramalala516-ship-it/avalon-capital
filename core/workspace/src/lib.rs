//! AvalonWorkspaceManager — sandboxed per-agent workspaces with canonical path checks.

use avalon_security::{AvalonError, AvalonResult};
use serde::{Deserialize, Serialize};
use std::path::{Component, Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceInfo {
    pub agent_id: String,
    pub root: PathBuf,
    pub quota_bytes: u64,
}

pub struct WorkspaceManager {
    base: PathBuf,
}

impl WorkspaceManager {
    pub fn new(base: impl AsRef<Path>) -> AvalonResult<Self> {
        let base = base.as_ref().to_path_buf();
        std::fs::create_dir_all(&base)
            .map_err(|e| AvalonError::Internal(format!("workspace base: {e}")))?;
        Ok(Self { base })
    }

    pub fn create(&self, agent_id: &str) -> AvalonResult<WorkspaceInfo> {
        validate_agent_id(agent_id)?;
        let root = self.base.join(agent_id);
        for sub in [
            "input",
            "output",
            "reports",
            "charts",
            "datasets",
            "temporary",
            "metadata",
        ] {
            std::fs::create_dir_all(root.join(sub))
                .map_err(|e| AvalonError::Internal(format!("workspace mkdir: {e}")))?;
        }
        Ok(WorkspaceInfo {
            agent_id: agent_id.to_string(),
            root,
            quota_bytes: 2_147_483_648,
        })
    }

    pub fn resolve(&self, agent_id: &str, relative: &str) -> AvalonResult<PathBuf> {
        validate_agent_id(agent_id)?;
        let root = self
            .base
            .join(agent_id)
            .canonicalize()
            .unwrap_or_else(|_| self.base.join(agent_id));
        let candidate = root.join(relative);
        let canonical = normalize_path(&candidate);
        let root_norm = normalize_path(&root);
        if !canonical.starts_with(&root_norm) {
            return Err(AvalonError::PermissionDenied(format!(
                "path traversal blocked: {relative}"
            )));
        }
        // Extra check for .. components before canonicalize exists
        if path_has_escape(relative) {
            return Err(AvalonError::PermissionDenied(
                "path traversal blocked".into(),
            ));
        }
        Ok(canonical)
    }

    pub fn base(&self) -> &Path {
        &self.base
    }
}

fn validate_agent_id(agent_id: &str) -> AvalonResult<()> {
    if agent_id.is_empty()
        || agent_id.contains("..")
        || agent_id.contains('/')
        || agent_id.contains('\\')
    {
        return Err(AvalonError::InvalidArgument("invalid agent_id".into()));
    }
    Ok(())
}

fn path_has_escape(relative: &str) -> bool {
    Path::new(relative).components().any(|c| matches!(c, Component::ParentDir))
}

fn normalize_path(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for c in path.components() {
        match c {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn blocks_traversal() {
        let dir = tempdir().unwrap();
        let ws = WorkspaceManager::new(dir.path()).unwrap();
        ws.create("macro-x").unwrap();
        assert!(ws.resolve("macro-x", "../../etc/passwd").is_err());
        assert!(ws.resolve("macro-x", "output/report.json").is_ok());
    }
}
