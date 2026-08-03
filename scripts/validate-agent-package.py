#!/usr/bin/env python3
"""Validate an Avalon agent package without cargo/Rust.

Usage:
  python3 scripts/validate-agent-package.py agents/codex-drop/macro-x
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

FORBIDDEN = {"shell.raw"}
FORBIDDEN_SUBSTR = ("powershell", "cmd.exe")
REQUIRED = ("schema_version", "agent_id", "name", "version", "runtime", "entrypoint")
AGENT_ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]*$")


def fail(msg: str) -> None:
    print(f"FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> int:
    if len(sys.argv) != 2:
        fail("Usage: validate-agent-package.py <package-dir>")
    root = Path(sys.argv[1]).resolve()
    if not root.is_dir():
        fail(f"not a directory: {root}")

    manifest_path = root / "avalon-agent.json"
    if not manifest_path.is_file():
        fail("avalon-agent.json missing")

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        fail(f"invalid JSON: {e}")

    for key in REQUIRED:
        if key not in manifest:
            fail(f"missing field: {key}")

    if manifest.get("schema_version") != 1:
        fail("schema_version must be 1")
    if not AGENT_ID_RE.match(str(manifest["agent_id"])):
        fail("invalid agent_id")
    if manifest.get("runtime") not in {"python", "native"}:
        fail("runtime must be python|native")

    entry = root / str(manifest["entrypoint"])
    if not entry.is_file():
        fail(f"entrypoint missing: {manifest['entrypoint']}")

    perms = manifest.get("permissions") or []
    if not isinstance(perms, list):
        fail("permissions must be an array")
    for p in perms:
        if p in FORBIDDEN or any(s in p for s in FORBIDDEN_SUBSTR):
            fail(f"forbidden permission: {p}")

    # SDK contract smoke (optional if not installed — try local path)
    repo = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo / "packages" / "python-sdk"))
    try:
        from avalon_agent_sdk import AvalonAgentClient  # noqa: F401
        sdk = "OK"
    except Exception as e:  # noqa: BLE001
        sdk = f"WARN ({e})"

    # Entrypoint should mention SDK for python agents
    if manifest["runtime"] == "python":
        src = entry.read_text(encoding="utf-8", errors="replace")
        if "avalon_agent_sdk" not in src and "AvalonAgentClient" not in src:
            fail("main entrypoint does not reference avalon_agent_sdk / AvalonAgentClient")
        vendor_sdk = root / "vendor" / "avalon_agent_sdk" / "__init__.py"
        if not vendor_sdk.is_file():
            fail("vendor/avalon_agent_sdk missing — Windows installs need a vendored SDK")

    print("PASS")
    print(f"  package:   {root}")
    print(f"  agent_id:  {manifest['agent_id']}")
    print(f"  version:   {manifest['version']}")
    print(f"  entry:     {manifest['entrypoint']}")
    print(f"  perms:     {len(perms)}")
    print(f"  sdk_import:{sdk}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
