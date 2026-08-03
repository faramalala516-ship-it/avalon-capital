#!/usr/bin/env python3
"""Macro-X — agent Avalon livré par Codex.

Cycle brokerisé :
  1) demande séries FRED via le Kernel / tools
  2) audit local dans le workspace isolé
  3) publie le régime macro
  4) génère un brief
  5) appelle uniquement le LLM Gateway local

Sans données Broker exploitables → INSUFFICIENT_EVIDENCE
(aucune direction de marché inventée).
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# SDK resolution order (Windows install-safe):
# 1) vendor/ next to this package (shipped with Codex drop)
# 2) monorepo packages/python-sdk when developing in-tree
# 3) PYTHONPATH / site-packages
_HERE = Path(__file__).resolve().parent
_VENDOR = _HERE / "vendor"
if _VENDOR.is_dir():
    sys.path.insert(0, str(_VENDOR))
else:
    _REPO = _HERE.parents[2] if len(_HERE.parents) > 2 else _HERE
    # agents/codex-drop/macro-x -> repo root is parents[3]
    for candidate in (
        _HERE.parents[3] / "packages" / "python-sdk" if len(_HERE.parents) > 3 else None,
        _HERE.parents[2] / "packages" / "python-sdk" if len(_HERE.parents) > 2 else None,
    ):
        if candidate and candidate.is_dir():
            sys.path.insert(0, str(candidate))
            break

try:
    from avalon_agent_sdk import AvalonAgentClient  # noqa: E402
except ImportError as e:  # pragma: no cover
    sys.stderr.write(
        "FATAL: avalon_agent_sdk missing. Expected vendor/avalon_agent_sdk in the agent package.\n"
        f"detail: {e}\n"
    )
    raise SystemExit(2) from e

SERIES = ("UNRATE", "CPIAUCSL", "FEDFUNDS")
VERSION = "0.3.1-codex"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def _append_audit(ws: Path, event: str, detail: dict[str, Any]) -> None:
    audit = ws / "metadata" / "macro_audit.jsonl"
    audit.parent.mkdir(parents=True, exist_ok=True)
    row = {"ts": _utc_now(), "event": event, "detail": detail}
    with audit.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")


def _broker_has_usable_data(tool_responses: list[dict[str, Any]]) -> bool:
    """Fail closed: stub/offline/empty responses are NOT evidence."""
    if not tool_responses:
        return False
    for resp in tool_responses:
        if not isinstance(resp, dict):
            continue
        if resp.get("offline") is True:
            continue
        if resp.get("status") in {"NOT_CONFIGURED", "DENIED", "ERROR"}:
            continue
        # Accept only explicit series payload / observations from broker
        if resp.get("observations") or resp.get("series") or resp.get("data"):
            return True
        if resp.get("accepted") and resp.get("note"):
            # task-queue ack without data ≠ usable evidence
            continue
    return False


def _infer_regime(tool_responses: list[dict[str, Any]]) -> dict[str, Any]:
    if not _broker_has_usable_data(tool_responses):
        return {
            "regime": "INSUFFICIENT_EVIDENCE",
            "claim_kind": "INSUFFICIENT_EVIDENCE",
            "direction": None,
            "confidence": 0.0,
            "reason": "No usable FRED/broker series returned via Avalon NetworkBroker/tools",
        }
    # Reserved for real broker payloads — never invent direction without data
    return {
        "regime": "UNKNOWN",
        "claim_kind": "DATA_PRESENT_UNCLASSIFIED",
        "direction": None,
        "confidence": 0.0,
        "reason": "Broker returned data but classifier not yet applied",
        "raw_count": len(tool_responses),
    }


def request_fred_series(client: AvalonAgentClient) -> list[dict[str, Any]]:
    ws = client.get_workspace()
    responses: list[dict[str, Any]] = []
    intents = []
    for series_id in SERIES:
        intent = {
            "provider_id": "fred",
            "method": "GET",
            "path": "/fred/series/observations",
            "series_id": series_id,
        }
        intents.append(intent)
        resp = client.request_tool("macro.get_series", {"series_id": series_id})
        if not isinstance(resp, dict):
            resp = {"status": "ERROR", "raw": str(resp)}
        responses.append({"series_id": series_id, **resp})
        _append_audit(ws, "fred.series.requested", {"series_id": series_id, "response": resp})

    _write_json(ws / "metadata" / "network_intent.json", {"intents": intents, "at": _utc_now()})
    _write_json(ws / "metadata" / "fred_tool_responses.json", responses)
    return responses


def write_brief(ws: Path, regime: dict[str, Any], responses: list[dict[str, Any]]) -> Path:
    reports = ws / "reports"
    reports.mkdir(parents=True, exist_ok=True)
    brief = reports / "macro-brief.md"
    lines = [
        "# Macro-X Brief",
        "",
        f"- Generated: {_utc_now()}",
        f"- Regime: **{regime.get('regime')}**",
        f"- Claim: `{regime.get('claim_kind')}`",
        f"- Direction: `{regime.get('direction')}`",
        f"- Confidence: {regime.get('confidence')}",
        f"- Reason: {regime.get('reason')}",
        "",
        "## Series requested (broker-mediated)",
    ]
    for series_id in SERIES:
        lines.append(f"- `{series_id}`")
    lines.extend(
        [
            "",
            "## Evidence policy",
            "",
            "If the Avalon NetworkBroker / tools do not return usable observations,",
            "Macro-X emits **INSUFFICIENT_EVIDENCE** and does **not** invent market direction.",
            "",
            f"Tool responses captured: {len(responses)}",
            "",
        ]
    )
    brief.write_text("\n".join(lines), encoding="utf-8")
    return brief


def run_macro_cycle(client: AvalonAgentClient) -> dict[str, Any]:
    ws = client.get_workspace()
    _append_audit(ws, "cycle.start", {"agent_id": client.agent_id, "version": VERSION})

    responses = request_fred_series(client)
    regime = _infer_regime(responses)

    client.publish_event(
        "macro.regime.changed",
        {
            "regime": regime["regime"],
            "claim_kind": regime["claim_kind"],
            "direction": regime["direction"],
            "confidence": regime["confidence"],
            "source": "macro-x",
            "version": VERSION,
        },
    )
    _append_audit(ws, "regime.published", regime)

    brief = write_brief(ws, regime, responses)
    client.create_artifact("macro-brief", str(brief))

    # Local LLM Gateway only — no cloud model routing from this agent
    model = client.call_model(
        [
            {
                "role": "user",
                "content": (
                    "Summarize macro regime strictly from broker evidence. "
                    f"Current claim={regime['claim_kind']} regime={regime['regime']}. "
                    "If evidence is insufficient, say so; do not invent market direction."
                ),
            }
        ],
        model_id="local-stub",
    )
    _write_json(ws / "metadata" / "llm_local.json", model)
    _append_audit(ws, "llm.local.called", {"model_id": "local-stub"})

    result = {
        "agent_id": client.agent_id,
        "version": VERSION,
        "regime": regime,
        "brief": str(brief),
        "model": model,
        "status": "completed",
        "evidence": "present" if _broker_has_usable_data(responses) else "INSUFFICIENT_EVIDENCE",
    }
    _write_json(ws / "metadata" / "last_cycle.json", result)
    _append_audit(ws, "cycle.completed", {"evidence": result["evidence"]})
    return result


def main() -> int:
    agent_id = os.environ.get("AVALON_AGENT_ID", "macro-x")
    workspace = Path(os.environ.get("AVALON_WORKSPACE", "."))
    client = AvalonAgentClient(agent_id=agent_id, workspace=workspace)
    client.register_agent(
        name="Macro-X",
        version=VERSION,
        capabilities=["macro", "excel", "local-llm", "fred-broker"],
    )
    client.report_health("ok", detail="macro-x codex package running")
    client.subscribe("data.updated")
    client.subscribe("system.started")
    result = run_macro_cycle(client)
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
