# Implementation Plan — Avalon Agentique Platform-Core

## Guiding Rules

- Preserve existing Next.js Avalon Capital SaaS (no silent deletion).
- Fail closed on crypto / permission / vault failures.
- No security theater; mark PLACEHOLDER explicitly.
- Linux CI builds and tests Core libraries; Windows installer artifacts prepared via NSIS/WiX configs + `build.ps1`.
- Commit logically after each major phase cluster.

## Phase Checklist

| Phase | Deliverable | Exit criteria |
|---|---|---|
| 0 | Audits + this plan | Docs present |
| 1 | Monorepo + Cargo/npm/python workspaces | `cargo check` workspace resolves |
| 2 | Tauri desktop skeleton | App boots in dev (or headless core binary on Linux CI) |
| 3 | AvalonCoreKernel | Startup/shutdown/health tests |
| 4 | Secure Vault + encrypted DB | Wrong key fails; plaintext absence test |
| 5 | Permission Engine | Deny default + grant/deny tests |
| 6 | Agent Runtime Manager | Start/stop/crash containment |
| 7 | Event Bus | Publish/subscribe + permission |
| 8 | Tool Registry | Schema-validated tools |
| 9 | Privilege Broker | Unauthorized typed ops denied + audited |
| 10 | Network Broker + offline modes | Allowlist + OFFLINE_LOCK |
| — | **SECURITY_REVIEW_1** | Critical issues fixed |
| 11 | LLM Gateway + Model Registry | Local provider adapter interface |
| 12 | Workspaces + Data catalog seams | Path traversal blocked |
| 13 | Command Center UI (real state) | Overview/Agents/Security/Audit/Matrix |
| 14 | Python Agent SDK + HelloAvalon | Registration demo |
| 15 | Macro-X / Gem-Trade / MetaQuant placeholders + mock Macro-X | Contract test J |
| 16 | Security & adversarial tests | Suite green |
| 17 | Installer packaging | Scripts + NSIS/WiX; release folder layout |
| 18 | E2E validation + `AVALON_CORE_BUILD_REPORT.md` | DoD evidence |

## Build Commands (target)

```text
scripts/dev.sh | build.ps1 -Dev
scripts/test.sh | build.ps1 -Test
scripts/security-test.sh
scripts/build.sh | build.ps1 -Release
scripts/package-installer.ps1
```

## Encryption Strategy (honest)

1. Prefer `rusqlite` with vendored SQLCipher when the toolchain compiles.
2. If SQLCipher bundling fails in CI, ship **AES-256-GCM sealed SQLite files** (entire DB ciphertext at rest; key from vault). Document in CRYPTOGRAPHY.md — still fails plaintext SQLite open tests.
3. Application crypto: AES-256-GCM via `aes-gcm` + `zeroize` secret wrappers.
4. Windows root: DPAPI user scope. Non-Windows: `DevFileRootKeyProvider` for development/tests only (never marketed as DPAPI).

## Immediate Next Step

Execute Phase 1: create directory tree, Cargo workspace, contracts schemas, and baseline crates.
