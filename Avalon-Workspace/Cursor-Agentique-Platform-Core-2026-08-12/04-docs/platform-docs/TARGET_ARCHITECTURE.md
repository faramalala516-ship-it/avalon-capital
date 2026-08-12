# Target Architecture — Avalon Agentique Platform-Core

**Version:** 1.0.0 (V1)  
**Platform:** Windows 10/11 x64 first; Linux CI/dev supported for core libraries  
**Shell:** Tauri 2 + React + TypeScript + Vite  
**Native core:** Rust stable workspace  
**Agents:** Python ≥ 3.12 via Agent Host

---

## 1. Trust Hierarchy (non-negotiable)

```
USER
  ↓
AVALON COMMAND CENTER (React — untrusted)
  ↓
AVALON CORE KERNEL (Rust)
  ↓
POLICY + PERMISSIONS
  ↓
AGENT ORCHESTRATION
  ↓
TOOLS / MODELS / DATA
  ↓
PRIVILEGE & NETWORK BROKERS
  ↓
OPERATING SYSTEM
```

Forbidden paths:

- LLM → admin shell  
- Plugin → secret store  
- Frontend → system privilege  
- Agent → uncontrolled internet  

---

## 2. Monorepo Layout

```
/
├── apps/
│   ├── desktop/                 # Tauri 2 + Vite React Command Center
│   └── web-capital/             # PLACEHOLDER pointer: existing Next.js SaaS remains at repo root for deploy continuity
├── core/
│   ├── kernel/                  # AvalonCoreKernel
│   ├── security/                # crypto primitives, typed errors
│   ├── vault/                   # AvalonSecureVault + key hierarchy
│   ├── permissions/             # AvalonPermissionEngine
│   ├── ipc/                     # session tokens / service identity
│   ├── events/                  # AvalonEventBus
│   ├── registry/                # agents, tools, models, apps, prompts
│   ├── workspace/               # sandbox + path canonicalization
│   ├── network/                 # AvalonNetworkBroker
│   ├── audit/                   # AvalonAuditLedger (tamper-evident)
│   ├── updates/                 # manual/disabled updater stubs
│   └── system/                  # paths, health, safe mode, resources
├── services/
│   ├── agent-host/              # process supervision for agents
│   ├── privilege-broker/        # typed privileged ops only
│   ├── data-service/            # catalog, lineage hooks, DuckDB/Parquet seams
│   ├── scheduler/               # jobs without privilege inflation
│   └── llm-gateway/             # local model providers
├── agents/
│   ├── installed/               # registered agent packages
│   ├── templates/               # hello-avalon, macro-x mock, placeholders
│   └── sdk/                     # Python avalon_agent_sdk
├── packages/
│   ├── contracts/               # JSON Schema + shared types
│   ├── ui/                      # shared UI tokens (optional)
│   ├── python-sdk/              # published layout for pip -e
│   └── rust-sdk/                # thin re-exports for plugins
├── runtime/                     # default runtime scaffolding (not user data)
├── migrations/                  # SQLCipher/core DB migrations
├── installer/                   # NSIS/WiX configs, icons, build.ps1 helpers
├── scripts/                     # dev/test/build/package
├── tests/                       # unit / integration / security / e2e harnesses
├── docs/                        # architecture & security docs
├── tools/                       # developer utilities
└── (existing Next.js SaaS files preserved at root)
```

---

## 3. Process Model

| Process | Language | Privilege |
|---|---|---|
| Desktop shell (Tauri) | Rust + WebView | User |
| Core Kernel (in Tauri backend or sidecar) | Rust | User |
| Privilege Broker | Rust | User (typed ops only; no raw shell) |
| Agent Host | Rust supervisor | User |
| Agent workers | Python | Restricted; workspace sandbox |
| LLM Gateway | Rust (HTTP to local providers) | User; no secret exfil to UI |

Crash of an agent must not stop the Kernel.

---

## 4. Data Planes

| Plane | Technology | Contents |
|---|---|---|
| Secure Core DB | SQLite + SQLCipher **or** AES-256-GCM sealed SQLite file if SQLCipher bundling unavailable | agents, plugins, permissions, sessions, registries, audit metadata |
| Secrets | AvalonSecureVault (encrypted blobs; never in frontend) | API keys, tokens, DEKs wrapped by KEKs |
| Analytics | DuckDB (optional V1 seam) | analytical queries |
| Datasets | Parquet under workspace/data | agent datasets |
| Backups | `.avalon-backup` encrypted archives | manifest + ciphertext + checksums |

**Key hierarchy:**

```
RootKeyProvider (Windows DPAPI user-scope | DevFileProvider on non-Windows)
  → KEKs (vault, database, agent-secrets, audit, backup, session)
    → DEKs
      → encrypted data
```

---

## 5. Agent Model

Manifest: `avalon-agent.json` (JSON Schema validated; incompatible `schema_version` rejected).

Package: `.avalon-agent` bundle (inspect → validate → show permissions → approve → install → register).

Placeholders (NOT_INSTALLED until packaged):

- Macro-X (`macro-x`)
- Gem-Trade (`gem-trade`)
- MetaQuant Sigma (`metaquant-sigma`)

Example agent: `HelloAvalonAgent` validates SDK paths.

---

## 6. Security Subsystems

- **PermissionEngine:** deny-by-default; risk levels 0–4; AUTO/ASK/DENY policies  
- **PrivilegeBroker:** typed requests only (`RestartAvalonService`, `OpenApplication`, …) — **no** `execute_powershell(string)`  
- **NetworkBroker:** allowlists + ONLINE / SYNC_ONLY / OFFLINE_LOCK  
- **WorkspaceManager:** canonical path checks; block traversal  
- **AuditLedger:** append-only hash chain (tamper-evident, not tamper-proof)  
- **ApprovalManager:** ALLOW ONCE / SESSION / SCOPED ALWAYS / DENY  

---

## 7. Local API & IPC

- Bind `127.0.0.1` only by default  
- Short-lived internal session tokens; localhost ≠ trusted  
- Frontend invokes Tauri commands with capability scopes; never receives secret values  

---

## 8. UI — Avalon Command Center

Institutional dark densified shell. Navigation: Overview, Agents, Macro, Markets, Data, Calendar, Workspaces, Models, Tools, Automations, Security, Audit, Settings, **The Matrix**.

UI binds to **real** Core state only (no fake production data).

---

## 9. Installer (Windows)

- NSIS `.exe` (+ WiX `.msi` when toolchain available)  
- Binaries → `Program Files\Avalon Capital\Avalon Agentique Platform\`  
- Data → `%LOCALAPPDATA%\Avalon Capital\Agentique Platform\`  
- Secrets never beside EXE  
- Offline WebView2 bootstrap strategy documented  

---

## 10. Phased Delivery

Phases 0–18 per master directive. Security Review checkpoint after Phase 10 (`docs/SECURITY_REVIEW_1.md`). Definition of Done requires installable Windows artifact configs, passing security tests, and Macro-X mock contract compliance.

---

## 11. Coexistence with Web SaaS

The root Next.js Avalon Capital site remains the cloud product. Platform-Core does not embed Clerk/Stripe/Postgres. Shared IP is limited to contracts, prompts, and branding guidelines migrated into `packages/contracts` / agent templates.
