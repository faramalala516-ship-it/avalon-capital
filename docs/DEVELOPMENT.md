# Development

```bash
# Core
cargo test
cargo run -p avalon-kernel -- --data-dir /tmp/avalon-dev --dev self-test
cargo run -p avalon-kernel -- --data-dir /tmp/avalon-dev --dev serve

# Desktop UI (Vite)
cd apps/desktop && npm install && npm run dev

# Python SDK
pip install -e packages/python-sdk
```

`AVALON_DEV_MODE` / `--dev` enables debug logs and shows DEVELOPMENT MODE banner in UI. Production protections remain.
