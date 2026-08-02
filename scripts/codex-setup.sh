#!/usr/bin/env bash
# Bootstrap Codex/dev env inside avalon-capital (the monorepo with Cargo.toml).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== Avalon Codex setup =="
echo "repo: $ROOT"

if [[ ! -f "$ROOT/Cargo.toml" ]]; then
  echo "ERROR: Cargo.toml introuvable. Ouvre le dépôt avalon-capital, pas AGENTIQUE." >&2
  exit 1
fi

if [[ ! -d "$ROOT/packages/python-sdk/avalon_agent_sdk" ]]; then
  echo "ERROR: packages/python-sdk manquant." >&2
  exit 1
fi

echo "-- Python SDK (editable) --"
python3 -m pip install -e "$ROOT/packages/python-sdk" -q
python3 -c "from avalon_agent_sdk import AvalonAgentClient; print('avalon_agent_sdk OK')"

echo "-- Validate Macro-X drop package --"
python3 "$ROOT/scripts/validate-agent-package.py" "$ROOT/agents/codex-drop/macro-x"

if command -v cargo >/dev/null 2>&1; then
  echo "-- cargo: $(command -v cargo) --"
  cargo -V
  echo "Install agent:"
  echo "  cargo run -p avalon-kernel -- agents install agents/codex-drop/macro-x"
else
  echo "WARN: cargo absent dans ce PATH."
  echo "Tu peux quand même coder/valider le paquet Python."
  echo "Pour l'install Core, utilise une machine/CI avec Rust, ou Codespace/Cursor cloud sur ce repo."
fi

echo "DONE. Voir CODEX.md"
