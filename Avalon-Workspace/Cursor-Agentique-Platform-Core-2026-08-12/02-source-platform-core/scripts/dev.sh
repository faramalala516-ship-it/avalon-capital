#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA="${1:-/tmp/avalon-dev}"
cd "$ROOT"
cargo run -p avalon-kernel -- --data-dir "$DATA" --dev serve
