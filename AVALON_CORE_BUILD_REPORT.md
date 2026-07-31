# AVALON CORE BUILD REPORT

## EXECUTIVE STATUS

Avalon Agentique Platform-Core **0.1.0** is implemented as a Rust workspace + Tauri/React Command Center + Python Agent SDK. Core CLI `avalon-core` builds and passes self-test plus **14/14** security acceptance tests. Existing Avalon Capital Next.js SaaS is preserved. Windows NSIS/MSI/Tauri installer configs are prepared; full GUI installer artifact generation requires a Windows + WebView2 build host.

## ARCHITECTURE IMPLEMENTED

Strict hierarchy UI → Kernel → Policy → Agents → Brokers → OS. Monorepo crates under `core/*`, `services/*`, `apps/desktop`, `agents/*`, `packages/*`.

## REPOSITORY STRUCTURE

`apps/desktop`, `core/{kernel,security,vault,permissions,ipc,events,registry,workspace,network,audit,updates,system}`, `services/{agent-host,privilege-broker,data-service,scheduler,llm-gateway}`, `agents/{templates,sdk}`, `packages/{contracts,python-sdk,rust-sdk}`, `installer`, `scripts`, `docs`, `migrations`, `release`. Root Next.js SaaS retained.

## DESKTOP APPLICATION STATUS

Vite + React Command Center implemented (Overview, Agents, Security, Audit, Matrix, Settings, First Run). Tauri 2 shell (`apps/desktop/src-tauri`) embeds Kernel via invoke commands with restrictive capabilities. Linux CI builds Core without requiring WebKit; Windows `tauri build` produces EXE/MSI when toolchain present.

## CORE KERNEL STATUS

`AvalonCoreKernel` bootstraps vault, sealed DB, audit, permissions, events, network, workspaces, agents, tools/models/prompts/apps/plugins, privilege broker, LLM gateway, scheduler, backups, IPC auth, health aggregation, safe mode, local `127.0.0.1` API.

## SECURE VAULT STATUS

Operational. Create/read/rotate/delete. UI receives metadata only. Persistence is AES-256-GCM sealed.

## CRYPTOGRAPHY IMPLEMENTED

AES-256-GCM (`aes-gcm`), HKDF-SHA256 domain KEKs, HMAC session tokens, SHA-256 audit chain, `zeroize` secret wrappers. No homemade crypto.

## SQLCIPHER STATUS

Vendored SQLCipher not enabled in this CI toolchain. **Equivalent control:** entire `avalon_core.db` is AES-256-GCM sealed at rest; stock SQLite cannot read plaintext (Acceptance G green). Documented in `docs/CRYPTOGRAPHY.md`.

## KEY MANAGEMENT STATUS

RootKeyProvider (DPAPI on Windows / DevFile on non-Windows) → domain KEKs → data. Rotation API with ACTIVE/DEPRECATED. Separate vault/database/agent-secrets/audit/backup/session keys.

## PERMISSION ENGINE STATUS

Deny-by-default. Risk 0–4. AUTO/ASK/DENY. Raw shell permanently denied + audited. ApprovalManager decisions implemented.

## PRIVILEGE BROKER STATUS

Typed ops only. Unauthorized requests denied + audited. Injection characters rejected. `reject_raw_shell` hard deny.

## NETWORK BROKER STATUS

Allowlists, provider registry, ONLINE / SYNC_ONLY / OFFLINE_LOCK. Arbitrary hosts denied.

## AGENT RUNTIME STATUS

Manifest JSON Schema validation, placeholders (Macro-X, Gem-Trade, MetaQuant Sigma), start/stop/crash containment, process spawn for Python when entrypoint exists.

## AGENT SDK STATUS

`avalon_agent_sdk` Python package + HelloAvalonAgent demo.

## EVENT BUS STATUS

Publish/subscribe/request-reply with history and security_level guard for agents.

## LLM GATEWAY STATUS

Local-first gateway with Ollama/llama.cpp OpenAI-compatible adapters + local stub fallback. Model registry present.

## WORKSPACE STATUS

Per-agent sandbox with canonical path checks; traversal blocked.

## UI STATUS

Institutional dark Command Center bound to live Core/API/Tauri state (no fake production metrics).

## MACRO-X COMPATIBILITY

Mock package + manifest + prompt seed + Acceptance J contract test PASS. Business logic not in Kernel.

## SECURITY TEST RESULTS

`cargo test -p avalon-kernel --test acceptance_security` → **14 passed** (vault, malicious agent, isolation, offline, crash, DB theft, audit tamper, approval deny, Macro-X, privilege broker, invalid manifest, untrusted plugin, backup, secrets DTO).

## END-TO-END TEST RESULTS

`avalon-core self-test` → **SELF_TEST_PASS**. Workspace `cargo test --exclude avalon-desktop` green.

## INSTALLER STATUS

NSIS (`installer/nsis/avalon.nsi`), WiX stub, Tauri bundle targets `nsis`+`msi`, `scripts/build.ps1` / `package-installer.ps1`, WebView2 bootstrap strategy documented.  
GitHub Actions job `windows-installer` (`.github/workflows/avalon-platform-core.yml`) builds Setup.exe/MSI on `windows-latest` and uploads `avalon-windows-installers`. **Linux agents cannot emit the EXE/MSI locally** — CI Windows is the production packaging path.

## FILES CREATED

Platform monorepo trees, docs (`EXISTING_ARCHITECTURE_AUDIT`, `TARGET_ARCHITECTURE`, `THREAT_MODEL`, `IMPLEMENTATION_PLAN`, security/architecture suite, `SECURITY_REVIEW_1`, `CODEX_AGENT_BUILD_GUIDE`, `SECURE_RECOVERY`), agents templates, Python/Rust SDKs, installer stubs, scripts, release metadata, this report.

## FILES MODIFIED

`README.md`, `.gitignore`; existing SaaS sources preserved.

## KNOWN LIMITATIONS

- Tauri GUI / NSIS/MSI full compile needs Windows (+ WebView2).
- DuckDB analytics seam is PLACEHOLDER (disabled).
- Excel COM automation is PLACEHOLDER; deterministic file marker + agent-side openpyxl path.
- Local LLM requires user-installed Ollama/llama.cpp; otherwise stub responds.
- Single-user V1 identity.

## SECURITY LIMITATIONS

- Same-user malware / admin compromise not fully preventable (documented).
- DevFileRootKeyProvider is not DPAPI.
- Audit is tamper-evident, not tamper-proof.
- Updater disabled (intentional).

## REMAINING TASKS

- Confirm first green `windows-installer` CI run on GitHub-hosted Windows; download artifacts.
- Authenticode signing pipeline with real Avalon Capital certificate (not fabricated).
- Optional SQLCipher feature flag when OpenSSL/sqlcipher vendoring validated.
- Expand Excel COM path + DuckDB enablement.

## BUILD COMMAND

`./scripts/build.sh` or `cargo build -p avalon-kernel --release`

## INSTALLER COMMAND

`scripts/build.ps1 -Release -Installer` (Windows) / `cd apps/desktop && npx tauri build`

## RUN COMMAND

`cargo run -p avalon-kernel -- --data-dir /tmp/avalon-dev --dev serve`  
UI: `cd apps/desktop && npm run dev`

## TEST COMMAND

`./scripts/test.sh` · `./scripts/security-test.sh`
