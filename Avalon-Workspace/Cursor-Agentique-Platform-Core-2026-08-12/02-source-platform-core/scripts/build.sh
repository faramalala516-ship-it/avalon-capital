#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
cargo build -p avalon-kernel --release
mkdir -p release
cp -f target/release/avalon-core release/avalon-core || cp -f target/debug/avalon-core release/avalon-core
echo "0.1.0" > release/version.txt
cat > release/manifest.json << EOF
{
  "product": "Avalon Agentique Platform",
  "version": "0.1.0",
  "build": "20260731.1",
  "artifacts": ["avalon-core"]
}
EOF
(cd release && sha256sum avalon-core version.txt manifest.json > checksums/SHA256SUMS 2>/dev/null || (mkdir -p checksums && sha256sum avalon-core version.txt manifest.json > checksums/SHA256SUMS))
echo "Built release/ core binary"
