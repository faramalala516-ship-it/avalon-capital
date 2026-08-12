//! AvalonScheduler — jobs inherit only already-granted permissions.

use avalon_security::{AvalonError, AvalonResult};
use chrono::{DateTime, Utc};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduledJob {
    pub job_id: String,
    pub agent_id: String,
    pub name: String,
    pub cron: Option<String>,
    pub run_at: Option<DateTime<Utc>>,
    pub enabled: bool,
    pub last_run: Option<DateTime<Utc>>,
    pub last_status: Option<String>,
    pub retries: u32,
    pub timeout_secs: u64,
}

pub struct Scheduler {
    jobs: RwLock<HashMap<String, ScheduledJob>>,
}

impl Scheduler {
    pub fn new() -> Self {
        Self {
            jobs: RwLock::new(HashMap::new()),
        }
    }

    pub fn add(&self, mut job: ScheduledJob) -> AvalonResult<ScheduledJob> {
        if job.agent_id.is_empty() {
            return Err(AvalonError::InvalidArgument(
                "job must belong to an agent".into(),
            ));
        }
        if job.job_id.is_empty() {
            job.job_id = Uuid::new_v4().to_string();
        }
        self.jobs.write().insert(job.job_id.clone(), job.clone());
        Ok(job)
    }

    pub fn list(&self) -> Vec<ScheduledJob> {
        self.jobs.read().values().cloned().collect()
    }

    /// Automation safety: scheduler never grants new permissions.
    pub fn note_permission_policy() -> &'static str {
        "Scheduled jobs use only permissions already granted to their owning agent."
    }
}

impl Default for Scheduler {
    fn default() -> Self {
        Self::new()
    }
}
