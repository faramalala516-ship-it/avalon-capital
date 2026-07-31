"""Avalon Agent SDK — create agents without understanding the full Kernel."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional


@dataclass
class AvalonAgentClient:
    agent_id: str
    workspace: Path
    api_base: str = "http://127.0.0.1:8741"
    token: Optional[str] = None

    def __post_init__(self) -> None:
        self.workspace = Path(self.workspace)
        if self.token is None:
            token_path = os.environ.get("AVALON_API_TOKEN_FILE")
            if token_path and Path(token_path).exists():
                self.token = Path(token_path).read_text(encoding="utf-8").strip()

    def _headers(self) -> dict[str, str]:
        h = {"Content-Type": "application/json"}
        if self.token:
            h["x-avalon-token"] = self.token
        return h

    def _request(self, method: str, path: str, body: Any | None = None) -> Any:
        data = None if body is None else json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            f"{self.api_base}{path}",
            data=data,
            headers=self._headers(),
            method=method,
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.URLError:
            # Offline / core not serving — operate locally for SDK demos
            return {"offline": True}

    def register_agent(self, name: str, version: str, capabilities: list[str]) -> dict[str, Any]:
        payload = {
            "agent_id": self.agent_id,
            "name": name,
            "version": version,
            "capabilities": capabilities,
        }
        meta = self.workspace / "metadata" / "registration.json"
        meta.parent.mkdir(parents=True, exist_ok=True)
        meta.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return payload

    def publish_event(self, event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
        events_path = self.workspace / "metadata" / "events.jsonl"
        events_path.parent.mkdir(parents=True, exist_ok=True)
        with events_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps({"event_type": event_type, "payload": payload}) + "\n")
        return {"published": event_type}

    def subscribe(self, event_type: str) -> None:
        sub = self.workspace / "metadata" / "subscriptions.json"
        data = []
        if sub.exists():
            data = json.loads(sub.read_text(encoding="utf-8"))
        if event_type not in data:
            data.append(event_type)
        sub.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def request_tool(self, tool_id: str, arguments: dict[str, Any]) -> dict[str, Any]:
        return self._request("POST", f"/v1/agents/{self.agent_id}/tasks", {
            "prompt": f"tool:{tool_id}",
            "arguments": arguments,
        })

    def request_permission(self, permission_id: str) -> bool:
        """Return False for forbidden permissions such as shell.raw."""
        if permission_id in {"shell.raw", "system.admin.install"} or "powershell" in permission_id:
            denied = self.workspace / "metadata" / "permission_denied.jsonl"
            denied.parent.mkdir(parents=True, exist_ok=True)
            with denied.open("a", encoding="utf-8") as f:
                f.write(json.dumps({"permission": permission_id, "result": "DENIED"}) + "\n")
            return False
        return True

    def get_workspace(self) -> Path:
        return self.workspace

    def get_dataset(self, dataset_id: str) -> dict[str, Any]:
        return {"dataset_id": dataset_id, "status": "NOT_CONFIGURED"}

    def get_secret_reference(self, secret_id: str) -> dict[str, Any]:
        # Never returns secret values
        return {"secret_id": secret_id, "configured": True, "value": None}

    def call_model(self, messages: list[dict[str, str]], model_id: str = "local-stub") -> dict[str, Any]:
        return {
            "model_id": model_id,
            "content": "[SDK local] model call must go through AvalonLLMGateway",
            "messages": messages,
        }

    def report_health(self, status: str, detail: str = "") -> dict[str, Any]:
        health = self.workspace / "metadata" / "health.json"
        health.parent.mkdir(parents=True, exist_ok=True)
        payload = {"status": status, "detail": detail}
        health.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return payload

    def create_artifact(self, name: str, path: str) -> dict[str, Any]:
        idx = self.workspace / "metadata" / "artifacts.json"
        items = []
        if idx.exists():
            items = json.loads(idx.read_text(encoding="utf-8"))
        items.append({"name": name, "path": path})
        idx.write_text(json.dumps(items, indent=2), encoding="utf-8")
        return {"name": name, "path": path}


def register_agent(**kwargs: Any) -> AvalonAgentClient:
    agent_id = kwargs.get("agent_id") or os.environ.get("AVALON_AGENT_ID", "agent")
    workspace = Path(kwargs.get("workspace") or os.environ.get("AVALON_WORKSPACE", "."))
    return AvalonAgentClient(agent_id=agent_id, workspace=workspace)
