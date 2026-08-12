#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "== Avalon Core tests =="
cargo test --workspace --exclude avalon-desktop
echo "== Kernel security acceptance =="
cargo test -p avalon-kernel --test acceptance_security
echo "== Kernel self-test =="
TMP=$(mktemp -d)
cargo run -q -p avalon-kernel -- --data-dir "$TMP" self-test
echo "ALL_GREEN"
