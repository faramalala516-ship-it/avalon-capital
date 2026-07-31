# Codex Agent Build Guide

1. Create folder under `agents/templates/<id>/`
2. Add `avalon-agent.json` (schema_version=1)
3. Implement `main.py` using `avalon_agent_sdk`
4. Declare permissions narrowly
5. Publish structured events; use ClaimKind
6. Never request shell.raw
7. Package as `.avalon-agent` bundle (manifest + code + hashes)
8. Install flow: inspect → validate → show permissions → approve → register
9. Tests: permission denied, workspace isolation, offline
