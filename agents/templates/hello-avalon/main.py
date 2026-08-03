#!/usr/bin/env python3
"""HelloAvalonAgent — validates Avalon Agent SDK surfaces."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_VENDOR = _HERE / "vendor"
if _VENDOR.is_dir():
    sys.path.insert(0, str(_VENDOR))
else:
    root = _HERE.parents[2] if len(_HERE.parents) > 2 else _HERE
    sdk = root / "packages" / "python-sdk"
    if sdk.is_dir():
        sys.path.insert(0, str(sdk))

from avalon_agent_sdk import AvalonAgentClient  # noqa: E402


def main() -> int:
    agent_id = os.environ.get("AVALON_AGENT_ID", "hello-avalon")
    workspace = Path(os.environ.get("AVALON_WORKSPACE", "."))
    client = AvalonAgentClient(agent_id=agent_id, workspace=workspace)

    client.register_agent(
        name="HelloAvalonAgent",
        version="0.1.0",
        capabilities=["sdk-demo"],
    )
    client.report_health("ok", detail="hello from HelloAvalonAgent")
    client.publish_event("agent.health", {"status": "ok"})
    ws = client.get_workspace()
    out = ws / "output" / "hello.txt"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("Hello Avalon\n", encoding="utf-8")
    client.create_artifact("hello.txt", str(out))

    denied = client.request_permission("shell.raw")
    assert denied is False, "shell.raw must be denied"

    print(json.dumps({"agent_id": agent_id, "status": "completed", "permission_shell_raw": denied}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
