#!/usr/bin/env python3
"""Macro-X mock agent — validates Core integration contract (Acceptance Test J)."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "packages" / "python-sdk"))

from avalon_agent_sdk import AvalonAgentClient  # noqa: E402


def main() -> int:
    agent_id = os.environ.get("AVALON_AGENT_ID", "macro-x")
    workspace = Path(os.environ.get("AVALON_WORKSPACE", "."))
    client = AvalonAgentClient(agent_id=agent_id, workspace=workspace)
    client.register_agent(name="Macro-X", version="0.1.0", capabilities=["macro", "excel", "local-llm"])
    client.report_health("ok", detail="macro-x mock running")
    client.publish_event("macro.regime.changed", {"regime": "UNKNOWN", "claim_kind": "UNKNOWN"})
    ws = client.get_workspace()
    (ws / "reports").mkdir(parents=True, exist_ok=True)
    (ws / "reports" / "mock-brief.md").write_text("# Macro-X Mock Brief\n", encoding="utf-8")
    client.request_tool("macro.get_series", {"series_id": "UNRATE"})
    # Network request is mediated by Core — SDK only records intent
    intent = {"provider_id": "fred", "method": "GET", "path": "/fred/series"}
    (ws / "metadata" / "network_intent.json").write_text(json.dumps(intent), encoding="utf-8")
    client.call_model([{"role": "user", "content": "Summarize regime"}], model_id="local-stub")
    print(json.dumps({"agent_id": agent_id, "status": "completed"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
