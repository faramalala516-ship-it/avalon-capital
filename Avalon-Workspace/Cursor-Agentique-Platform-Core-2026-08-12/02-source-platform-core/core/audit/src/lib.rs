//! AvalonAuditLedger — append-only, hash-chained, tamper-evident (not tamper-proof).

use avalon_security::{AvalonError, AvalonResult};
use chrono::{DateTime, Utc};
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{File, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    pub sequence: u64,
    pub timestamp: DateTime<Utc>,
    pub actor: String,
    pub action: String,
    pub resource: String,
    pub status: String,
    pub trace_id: String,
    pub previous_hash: String,
    pub current_hash: String,
    pub detail: Option<serde_json::Value>,
}

pub struct AuditLedger {
    path: PathBuf,
    state: Mutex<LedgerState>,
}

struct LedgerState {
    next_sequence: u64,
    last_hash: String,
}

impl AuditLedger {
    pub fn open(path: impl AsRef<Path>) -> AvalonResult<Self> {
        let path = path.as_ref().to_path_buf();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| AvalonError::Internal(format!("audit dir: {e}")))?;
        }
        let (next_sequence, last_hash) = if path.exists() {
            verify_chain(&path)?;
            load_tip(&path)?
        } else {
            (1, genesis_hash())
        };
        Ok(Self {
            path,
            state: Mutex::new(LedgerState {
                next_sequence,
                last_hash,
            }),
        })
    }

    pub fn append(
        &self,
        actor: &str,
        action: &str,
        resource: &str,
        status: &str,
        trace_id: Option<&str>,
        detail: Option<serde_json::Value>,
    ) -> AvalonResult<AuditEntry> {
        let mut state = self.state.lock();
        let trace = trace_id
            .map(|s| s.to_string())
            .unwrap_or_else(|| Uuid::new_v4().to_string());
        let timestamp = Utc::now();
        let previous_hash = state.last_hash.clone();
        let current_hash = hash_entry(
            state.next_sequence,
            &timestamp,
            actor,
            action,
            resource,
            status,
            &trace,
            &previous_hash,
            &detail,
        );
        let entry = AuditEntry {
            sequence: state.next_sequence,
            timestamp,
            actor: actor.to_string(),
            action: action.to_string(),
            resource: resource.to_string(),
            status: status.to_string(),
            trace_id: trace,
            previous_hash,
            current_hash: current_hash.clone(),
            detail,
        };
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.path)
            .map_err(|e| AvalonError::Internal(format!("audit open: {e}")))?;
        let line = serde_json::to_string(&entry).map_err(|e| AvalonError::Internal(e.to_string()))?;
        writeln!(file, "{line}").map_err(|e| AvalonError::Internal(format!("audit write: {e}")))?;
        file.flush()
            .map_err(|e| AvalonError::Internal(format!("audit flush: {e}")))?;
        state.next_sequence += 1;
        state.last_hash = current_hash;
        Ok(entry)
    }

    pub fn verify(&self) -> AvalonResult<()> {
        verify_chain(&self.path)
    }

    pub fn query(
        &self,
        agent_filter: Option<&str>,
        action_filter: Option<&str>,
        status_filter: Option<&str>,
        limit: usize,
    ) -> AvalonResult<Vec<AuditEntry>> {
        if !self.path.exists() {
            return Ok(vec![]);
        }
        let file = File::open(&self.path)
            .map_err(|e| AvalonError::Internal(format!("audit read: {e}")))?;
        let mut out = Vec::new();
        for line in BufReader::new(file).lines() {
            let line = line.map_err(|e| AvalonError::Internal(e.to_string()))?;
            if line.trim().is_empty() {
                continue;
            }
            let entry: AuditEntry = serde_json::from_str(&line)
                .map_err(|e| AvalonError::SecurityViolation(format!("audit parse: {e}")))?;
            if let Some(a) = agent_filter {
                if !entry.actor.contains(a) && !entry.resource.contains(a) {
                    continue;
                }
            }
            if let Some(a) = action_filter {
                if entry.action != a {
                    continue;
                }
            }
            if let Some(s) = status_filter {
                if entry.status != s {
                    continue;
                }
            }
            out.push(entry);
        }
        out.reverse();
        out.truncate(limit);
        Ok(out)
    }

    pub fn path(&self) -> &Path {
        &self.path
    }
}

fn genesis_hash() -> String {
    hex::encode(Sha256::digest(b"avalon-audit-genesis-v1"))
}

fn hash_entry(
    sequence: u64,
    timestamp: &DateTime<Utc>,
    actor: &str,
    action: &str,
    resource: &str,
    status: &str,
    trace_id: &str,
    previous_hash: &str,
    detail: &Option<serde_json::Value>,
) -> String {
    let detail_s = detail
        .as_ref()
        .map(|d| d.to_string())
        .unwrap_or_default();
    let material = format!(
        "{sequence}|{}|{actor}|{action}|{resource}|{status}|{trace_id}|{previous_hash}|{detail_s}",
        timestamp.to_rfc3339()
    );
    hex::encode(Sha256::digest(material.as_bytes()))
}

fn verify_chain(path: &Path) -> AvalonResult<()> {
    if !path.exists() {
        return Ok(());
    }
    let file = File::open(path).map_err(|e| AvalonError::Internal(e.to_string()))?;
    let mut expected_prev = genesis_hash();
    let mut expected_seq = 1u64;
    for line in BufReader::new(file).lines() {
        let line = line.map_err(|e| AvalonError::Internal(e.to_string()))?;
        if line.trim().is_empty() {
            continue;
        }
        let entry: AuditEntry = serde_json::from_str(&line)
            .map_err(|e| AvalonError::SecurityViolation(format!("audit corrupt: {e}")))?;
        if entry.sequence != expected_seq {
            return Err(AvalonError::SecurityViolation(format!(
                "audit sequence mismatch at {}",
                entry.sequence
            )));
        }
        if entry.previous_hash != expected_prev {
            return Err(AvalonError::SecurityViolation(format!(
                "audit chain break at sequence {}",
                entry.sequence
            )));
        }
        let recomputed = hash_entry(
            entry.sequence,
            &entry.timestamp,
            &entry.actor,
            &entry.action,
            &entry.resource,
            &entry.status,
            &entry.trace_id,
            &entry.previous_hash,
            &entry.detail,
        );
        if recomputed != entry.current_hash {
            return Err(AvalonError::SecurityViolation(format!(
                "audit hash mismatch at sequence {}",
                entry.sequence
            )));
        }
        expected_prev = entry.current_hash;
        expected_seq += 1;
    }
    Ok(())
}

fn load_tip(path: &Path) -> AvalonResult<(u64, String)> {
    let file = File::open(path).map_err(|e| AvalonError::Internal(e.to_string()))?;
    let mut last_hash = genesis_hash();
    let mut next = 1u64;
    for line in BufReader::new(file).lines() {
        let line = line.map_err(|e| AvalonError::Internal(e.to_string()))?;
        if line.trim().is_empty() {
            continue;
        }
        let entry: AuditEntry = serde_json::from_str(&line)
            .map_err(|e| AvalonError::SecurityViolation(e.to_string()))?;
        last_hash = entry.current_hash;
        next = entry.sequence + 1;
    }
    Ok((next, last_hash))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn chain_integrity_detects_tamper() {
        let dir = tempdir().unwrap();
        let ledger = AuditLedger::open(dir.path().join("audit.jsonl")).unwrap();
        ledger
            .append("kernel", "system.started", "platform", "OK", None, None)
            .unwrap();
        ledger
            .append("agent:macro-x", "permission.denied", "network", "DENIED", None, None)
            .unwrap();
        ledger.verify().unwrap();

        // Tamper
        let path = dir.path().join("audit.jsonl");
        let mut content = std::fs::read_to_string(&path).unwrap();
        content = content.replace("system.started", "system.hacked");
        std::fs::write(&path, content).unwrap();
        assert!(verify_chain(&path).is_err());
    }
}
