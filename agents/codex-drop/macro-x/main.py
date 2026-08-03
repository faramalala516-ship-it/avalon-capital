#!/usr/bin/env python3
"""Macro-X — agent Avalon livré par Codex (daemon).

Cycle brokerisé puis heartbeat permanent jusqu'à stop par Avalon Agent Host.
Sans données Broker → INSUFFICIENT_EVIDENCE (aucune direction inventée).
"""

from __future__ import annotations

import json
import os
import sys
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_HERE = Path(__file__).resolve().parent
_VENDOR = _HERE / "vendor"
if _VENDOR.is_dir():
    sys.path.insert(0, str(_VENDOR))
else:
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
VERSION = "0.3.4-codex"


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
    if not tool_responses:
        return False
    for resp in tool_responses:
        if not isinstance(resp, dict):
            continue
        if resp.get("offline") is True:
            continue
        if resp.get("status") in {"NOT_CONFIGURED", "DENIED", "ERROR"}:
            continue
        if resp.get("observations") or resp.get("series") or resp.get("data"):
            return True
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


def _keep_alive(client: AvalonAgentClient, result: dict[str, Any]) -> None:
    """Never return unless process is killed by Agent Host."""
    heartbeat = max(5, int(os.environ.get("AVALON_AGENT_HEARTBEAT_SECS", "15")))
    while True:
        try:
            client.report_health(
                "ok",
                detail=f"macro-x daemon alive; last_evidence={result.get('evidence')}",
            )
            _write_json(
                client.get_workspace() / "metadata" / "heartbeat.json",
                {"ts": _utc_now(), "evidence": result.get("evidence"), "version": VERSION},
            )
        except Exception as e:  # noqa: BLE001
            try:
                _append_audit(
                    client.get_workspace(),
                    "heartbeat.error",
                    {"error": str(e)},
                )
            except Exception:  # noqa: BLE001
                pass
        time.sleep(heartbeat)


def main() -> int:
    agent_id = os.environ.get("AVALON_AGENT_ID", "macro-x")
    workspace = Path(os.environ.get("AVALON_WORKSPACE", "."))
    once = os.environ.get("AVALON_AGENT_ONCE", "").strip().lower() in {"1", "true", "yes"}

    client = AvalonAgentClient(agent_id=agent_id, workspace=workspace)
    client.register_agent(
        name="Macro-X",
        version=VERSION,
        capabilities=["macro", "excel", "local-llm", "fred-broker", "daemon"],
    )
    client.report_health("ok", detail="macro-x daemon starting")
    client.subscribe("data.updated")
    client.subscribe("system.started")

    result: dict[str, Any]
    try:
        result = run_macro_cycle(client)
    except Exception as e:  # noqa: BLE001
        tb = traceback.format_exc()
        crash = workspace / "metadata" / "crash.log"
        crash.parent.mkdir(parents=True, exist_ok=True)
        crash.write_text(tb, encoding="utf-8")
        _append_audit(workspace, "cycle.error", {"error": str(e)})
        result = {
            "agent_id": agent_id,
            "version": VERSION,
            "status": "error",
            "evidence": "INSUFFICIENT_EVIDENCE",
            "error": str(e),
        }
        _write_json(workspace / "metadata" / "last_cycle.json", result)

    # stdout may be null under Agent Host — also persist
    _write_json(workspace / "metadata" / "last_stdout.json", result)

    if once:
        return 0

    try:
        _keep_alive(client, result)
    except Exception as e:  # noqa: BLE001
        _append_audit(workspace, "daemon.keepalive_crash", {"error": str(e)})
        # Fall through to last-resort sleep loop (Agent Host may also respawn).
        while True:
            time.sleep(30)
    return 0  # unreachable


if __name__ == "__main__":
    once = os.environ.get("AVALON_AGENT_ONCE", "").strip().lower() in {"1", "true", "yes"}
    try:
        raise SystemExit(main())
    except SystemExit:
        raise
    except BaseException as e:  # noqa: BLE001
        if once:
            raise
        sys.stderr.write(f"macro-x fatal (daemon hold): {e}\n")
        while True:
            time.sleep(30)
