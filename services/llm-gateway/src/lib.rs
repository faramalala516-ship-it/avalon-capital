//! AvalonLLMGateway — agents never depend on a provider directly.

use avalon_registry::ModelRegistry;
use avalon_security::{AvalonError, AvalonResult};
use async_trait::async_trait;
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRequest {
    pub model_id: String,
    pub messages: Vec<ChatMessage>,
    pub temperature: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    pub model_id: String,
    pub content: String,
    pub provider: String,
    pub usage: serde_json::Value,
}

#[async_trait]
pub trait LlmProvider: Send + Sync {
    fn id(&self) -> &str;
    async fn health(&self) -> AvalonResult<bool>;
    async fn chat(&self, req: &ChatRequest) -> AvalonResult<ChatResponse>;
}

/// OpenAI-compatible local server (Ollama / llama.cpp server).
pub struct OpenAiCompatibleProvider {
    pub id: String,
    pub base_url: String,
    pub client: reqwest::Client,
}

#[async_trait]
impl LlmProvider for OpenAiCompatibleProvider {
    fn id(&self) -> &str {
        &self.id
    }

    async fn health(&self) -> AvalonResult<bool> {
        let url = format!("{}/models", self.base_url.trim_end_matches('/'));
        match self.client.get(url).send().await {
            Ok(resp) => Ok(resp.status().is_success()),
            Err(_) => Ok(false),
        }
    }

    async fn chat(&self, req: &ChatRequest) -> AvalonResult<ChatResponse> {
        let url = format!(
            "{}/chat/completions",
            self.base_url.trim_end_matches('/')
        );
        let body = serde_json::json!({
            "model": req.model_id,
            "messages": req.messages,
            "temperature": req.temperature.unwrap_or(0.2)
        });
        let resp = self
            .client
            .post(url)
            .json(&body)
            .send()
            .await
            .map_err(|e| AvalonError::DataUnavailable(e.to_string()))?;
        if !resp.status().is_success() {
            return Err(AvalonError::DataUnavailable(format!(
                "llm provider HTTP {}",
                resp.status()
            )));
        }
        let v: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| AvalonError::DataUnavailable(e.to_string()))?;
        let content = v["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();
        Ok(ChatResponse {
            model_id: req.model_id.clone(),
            content,
            provider: self.id.clone(),
            usage: v.get("usage").cloned().unwrap_or(serde_json::json!({})),
        })
    }
}

/// Offline deterministic stub used when no local provider is reachable.
pub struct LocalStubProvider;

#[async_trait]
impl LlmProvider for LocalStubProvider {
    fn id(&self) -> &str {
        "local-stub"
    }

    async fn health(&self) -> AvalonResult<bool> {
        Ok(true)
    }

    async fn chat(&self, req: &ChatRequest) -> AvalonResult<ChatResponse> {
        let last = req
            .messages
            .last()
            .map(|m| m.content.as_str())
            .unwrap_or("");
        Ok(ChatResponse {
            model_id: req.model_id.clone(),
            content: format!(
                "[LOCAL STUB] No local LLM provider configured. Echo:\n{last}\n\nClaimKind: UNKNOWN"
            ),
            provider: "local-stub".into(),
            usage: serde_json::json!({"prompt_tokens": 0, "completion_tokens": 0}),
        })
    }
}

pub struct LlmGateway {
    providers: RwLock<Vec<Arc<dyn LlmProvider>>>,
    models: Arc<ModelRegistry>,
}

impl LlmGateway {
    pub fn new(models: Arc<ModelRegistry>) -> Self {
        let gw = Self {
            providers: RwLock::new(vec![Arc::new(LocalStubProvider) as Arc<dyn LlmProvider>]),
            models,
        };
        // Optional local endpoints — health checked lazily
        gw.try_add_openai_compat("ollama", "http://127.0.0.1:11434/v1");
        gw.try_add_openai_compat("llama.cpp", "http://127.0.0.1:8080/v1");
        gw
    }

    fn try_add_openai_compat(&self, id: &str, base: &str) {
        let provider = OpenAiCompatibleProvider {
            id: id.to_string(),
            base_url: base.to_string(),
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(2))
                .build()
                .unwrap_or_default(),
        };
        self.providers.write().push(Arc::new(provider));
    }

    pub async fn list_models(&self) -> Vec<avalon_registry::ModelRecord> {
        self.models.list()
    }

    pub async fn health(&self) -> serde_json::Value {
        let providers = self.providers.read().clone();
        let mut out = serde_json::Map::new();
        for p in providers {
            let ok = p.health().await.unwrap_or(false);
            out.insert(p.id().to_string(), serde_json::json!(ok));
            if p.id() == "ollama" && ok {
                self.models.set_status("ollama/llama3.2", "AVAILABLE");
            }
        }
        serde_json::Value::Object(out)
    }

    pub async fn chat(&self, req: ChatRequest) -> AvalonResult<ChatResponse> {
        let providers = self.providers.read().clone();
        // Prefer non-stub healthy providers
        for p in &providers {
            if p.id() == "local-stub" {
                continue;
            }
            if p.health().await.unwrap_or(false) {
                return p.chat(&req).await;
            }
        }
        providers
            .iter()
            .find(|p| p.id() == "local-stub")
            .ok_or_else(|| AvalonError::DataUnavailable("no llm provider".into()))?
            .chat(&req)
            .await
    }
}
