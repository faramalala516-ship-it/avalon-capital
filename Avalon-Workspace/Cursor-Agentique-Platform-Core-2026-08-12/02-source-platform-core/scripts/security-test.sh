#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
cargo test -p avalon-kernel --test acceptance_security
cargo test -p avalon-privilege-broker -p avalon-network -p avalon-permissions -p avalon-vault -p avalon-audit
