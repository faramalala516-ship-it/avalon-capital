#!/usr/bin/env python3
"""Macro-X — Avalon agent entrypoint (Codex extends business logic here).

This package runs under Avalon Agent Host. Core never embeds Macro-X logic.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# Prefer installed SDK; fall back to monorepo path when developing in-tree.
_REPO = Path(__file__).resolve().parents[3]
_SDK = _REPO / "packages" / "python-sdk"
if _SDK.is_dir():
    sys.path.insert(0, str(_SDK))

from avalon_agent_sdk import AvalonAgentClient  # noqa: E402


def run_macro_cycle(client: AvalonAgentClient) -> dict:
    """Codex: replace/extend this with real regime / release / prediction logic."""
    ws = client.get_workspace()
    reports = ws / "reports"
    reports.mkdir(parents=True, exist_ok=True)

    # Intent only — NetworkBroker mediates real HTTP when Core grants access.
    intent = {
        "provider_id": "fred",
        "method": "GET",
        "path": "/fred/series",
        "series_id": "UNRATE",
    }
    (ws / "metadata").mkdir(parents=True, exist_ok=True)
    (ws / "metadata" / "network_intent.json").write_text(
        json.dumps(intent, indent=2), encoding="utf-8"
    )

    client.request_tool("macro.get_series", {"series_id": "UNRATE"})
    client.publish_event(
        "macro.regime.changed",
        {"regime": "UNKNOWN", "claim_kind": "UNKNOWN", "source": "macro-x"},
    )

    brief = reports / "macro-brief.md"
    brief.write_text(
        "# Macro-X Brief\n\n"
        "Skeleton Codex package — replace with real macro intelligence output.\n",
        encoding="utf-8",
    )
    client.create_artifact("macro-brief", str(brief))

    model = client.call_model(
        [{"role": "user", "content": "Summarize current macro regime from available series."}],
        model_id="local-stub",
    )
    return {
        "agent_id": client.agent_id,
        "brief": str(brief),
        "model": model,
        "status": "completed",
    }


def main() -> int:
    agent_id = os.environ.get("AVALON_AGENT_ID", "macro-x")
    workspace = Path(os.environ.get("AVALON_WORKSPACE", "."))
    client = AvalonAgentClient(agent_id=agent_id, workspace=workspace)
    client.register_agent(
        name="Macro-X",
        version="0.2.0-codex",
        capabilities=["macro", "excel", "local-llm"],
    )
    client.report_health("ok", detail="macro-x codex package running")
    client.subscribe("data.updated")
    result = run_macro_cycle(client)
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
