//! AvalonEventBus — decoupled publish/subscribe with permission checks.

use avalon_permissions::PermissionEngine;
use avalon_security::{AvalonError, AvalonResult};
use chrono::{DateTime, Utc};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AvalonEvent {
    pub event_id: String,
    pub event_type: String,
    pub timestamp: DateTime<Utc>,
    pub source: String,
    pub target: Option<String>,
    pub correlation_id: Option<String>,
    pub payload_schema: Option<String>,
    pub payload: serde_json::Value,
    pub security_level: u8,
    pub trace_id: String,
}

type Handler = Arc<dyn Fn(&AvalonEvent) + Send + Sync>;

pub struct EventBus {
    subs: RwLock<HashMap<String, Vec<(String, Handler)>>>,
    history: RwLock<VecDeque<AvalonEvent>>,
    permissions: Option<Arc<PermissionEngine>>,
    capacity: usize,
}

impl EventBus {
    pub fn new(capacity: usize) -> Self {
        Self {
            subs: RwLock::new(HashMap::new()),
            history: RwLock::new(VecDeque::new()),
            permissions: None,
            capacity,
        }
    }

    pub fn with_permissions(mut self, permissions: Arc<PermissionEngine>) -> Self {
        self.permissions = Some(permissions);
        self
    }

    pub fn publish(&self, mut event: AvalonEvent) -> AvalonResult<()> {
        if event.event_id.is_empty() {
            event.event_id = Uuid::new_v4().to_string();
        }
        if event.trace_id.is_empty() {
            event.trace_id = Uuid::new_v4().to_string();
        }
        if event.timestamp.timestamp() == 0 {
            event.timestamp = Utc::now();
        }

        // High security events from agents require publish permission conceptually
        if event.security_level >= 3 {
            if let Some(perms) = &self.permissions {
                // Agents cannot publish privileged system events
                if event.source.starts_with("agent:") {
                    let _ = perms;
                    return Err(AvalonError::PermissionDenied(
                        "agents cannot publish security_level>=3 events".into(),
                    ));
                }
            }
        }

        {
            let mut hist = self.history.write();
            if hist.len() >= self.capacity {
                hist.pop_front();
            }
            hist.push_back(event.clone());
        }

        let subs = self.subs.read();
        if let Some(handlers) = subs.get(&event.event_type) {
            for (_, h) in handlers {
                h(&event);
            }
        }
        if let Some(handlers) = subs.get("*") {
            for (_, h) in handlers {
                h(&event);
            }
        }
        Ok(())
    }

    pub fn subscribe<F>(&self, event_type: &str, subscriber_id: &str, handler: F) -> String
    where
        F: Fn(&AvalonEvent) + Send + Sync + 'static,
    {
        let id = format!("{subscriber_id}:{}", Uuid::new_v4());
        self.subs
            .write()
            .entry(event_type.to_string())
            .or_default()
            .push((id.clone(), Arc::new(handler)));
        id
    }

    pub fn request_reply(
        &self,
        request_type: &str,
        source: &str,
        payload: serde_json::Value,
    ) -> AvalonResult<AvalonEvent> {
        let correlation = Uuid::new_v4().to_string();
        let event = AvalonEvent {
            event_id: Uuid::new_v4().to_string(),
            event_type: request_type.to_string(),
            timestamp: Utc::now(),
            source: source.to_string(),
            target: None,
            correlation_id: Some(correlation.clone()),
            payload_schema: None,
            payload,
            security_level: 1,
            trace_id: Uuid::new_v4().to_string(),
        };
        self.publish(event.clone())?;
        // V1 synchronous echo reply placeholder for infrastructure
        Ok(AvalonEvent {
            event_id: Uuid::new_v4().to_string(),
            event_type: format!("{request_type}.reply"),
            timestamp: Utc::now(),
            source: "event-bus".into(),
            target: Some(source.to_string()),
            correlation_id: Some(correlation),
            payload_schema: None,
            payload: serde_json::json!({"accepted": true}),
            security_level: 1,
            trace_id: event.trace_id,
        })
    }

    pub fn recent(&self, limit: usize) -> Vec<AvalonEvent> {
        let hist = self.history.read();
        hist.iter().rev().take(limit).cloned().collect()
    }

    pub fn system_event(event_type: &str, source: &str, payload: serde_json::Value) -> AvalonEvent {
        AvalonEvent {
            event_id: Uuid::new_v4().to_string(),
            event_type: event_type.to_string(),
            timestamp: Utc::now(),
            source: source.to_string(),
            target: None,
            correlation_id: None,
            payload_schema: None,
            payload,
            security_level: 1,
            trace_id: Uuid::new_v4().to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};

    #[test]
    fn publish_subscribe() {
        let bus = EventBus::new(100);
        let counter = Arc::new(AtomicUsize::new(0));
        let c2 = counter.clone();
        bus.subscribe("agent.started", "test", move |_| {
            c2.fetch_add(1, Ordering::SeqCst);
        });
        bus.publish(EventBus::system_event(
            "agent.started",
            "kernel",
            serde_json::json!({"agent_id": "hello"}),
        ))
        .unwrap();
        assert_eq!(counter.load(Ordering::SeqCst), 1);
    }
}
