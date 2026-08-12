# Testing

```bash
cargo test
cargo test -p avalon-kernel --test acceptance_security
cargo run -p avalon-kernel -- self-test
cd apps/desktop && npm test
pytest packages/python-sdk  # when tests added
```

Security suite covers vault, malicious agent, isolation, offline, crash, DB theft, audit tamper, approvals, Macro-X contract, privilege broker.
