#!/usr/bin/env bash
# Package an Avalon agent directory into release/agents/<id>-<version>.avalon-agent
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-}"
if [[ -z "$SRC" || ! -f "$SRC/avalon-agent.json" ]]; then
  echo "Usage: $0 <agent-package-dir>" >&2
  echo "Example: $0 agents/codex-drop/macro-x" >&2
  exit 1
fi
SRC="$(cd "$SRC" && pwd)"
ID="$(python3 -c "import json;print(json.load(open('$SRC/avalon-agent.json'))['agent_id'])")"
VER="$(python3 -c "import json;print(json.load(open('$SRC/avalon-agent.json'))['version'])")"
OUT_DIR="$ROOT/release/agents"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/package" "$OUT_DIR"
# Copy without junk
rsync -a --exclude '.git' --exclude '__pycache__' --exclude '*.pyc' --exclude '.pytest_cache' \
  "$SRC/" "$STAGE/package/"
(
  cd "$STAGE/package"
  find . -type f ! -name 'HASHES.sha256' -print0 | sort -z | while IFS= read -r -d '' f; do
    rel="${f#./}"
    hash="$(sha256sum "$f" | awk '{print $1}')"
    echo "$hash  $rel"
  done > HASHES.sha256
)
BUNDLE="$OUT_DIR/${ID}-${VER}.avalon-agent"
rm -f "$BUNDLE"
(
  cd "$STAGE"
  zip -qr "$BUNDLE" package
)
echo "Packed $BUNDLE"
cat "$STAGE/package/HASHES.sha256"
