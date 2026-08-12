# Existing Architecture Audit — Avalon Agentique Platform

**Date:** 2026-07-31  
**Branch:** `cursor/avalon-agentique-platform-core-14e5`  
**Auditor:** Avalon Platform Core Architect

---

## 1. Executive Summary

The repository currently hosts **Avalon Capital**, a **Next.js 15 institutional web SaaS** (market intelligence, macro research, trading scanner, gem investment). It is **not** an Avalon Agentique Platform desktop core.

| Capability | Present? |
|---|---|
| Windows-installable desktop shell | No |
| Tauri / Rust native core | No |
| Secure Vault / DPAPI / key hierarchy | No |
| SQLCipher / encrypted local DB | No |
| Agent runtime / process isolation | No |
| Privilege / network brokers | No |
| Python agent SDK | No |
| Installer (EXE/MSI) | No |

**Decision:** Preserve the existing web SaaS intact. Build the Agentique Platform-Core as a co-located monorepo (new trees). Do not delete functional web components.

---

## 2. Existing Components

### 2.1 Application surface

| Path | Role |
|---|---|
| `app/` | Next.js App Router pages (dashboard, macro, trading, gem, auth, admin…) |
| `app/api/` | HTTP API routes (agents, market-ai, macro, trading, portfolio, stripe, health) |
| `components/` | React UI (navigation, market AI assistant, charts, Clerk auth) |
| `lib/` | Domain logic: agents, prompts, market-AI, Prisma, Redis, Stripe, auth |
| `hooks/use-avalon-data.ts` | React Query data hooks |
| `prisma/schema.prisma` | PostgreSQL schema (users, portfolios, signals, macro events, gems) |
| `tests/market-ai.test.ts` | Vitest coverage for market-AI fallback |
| `scripts/prepare-sites-dist.mjs` | Cloudflare Sites / OpenNext packaging |
| `.github/workflows/ci.yml` | CI (Postgres, lint, typecheck, test, build) |
| `Dockerfile` / `docker-compose.yml` | Postgres + Redis local stack |

### 2.2 Agent-related code (web SaaS only)

| ID | Location | Nature |
|---|---|---|
| `macro-x` | `lib/data.ts`, `lib/agents.ts`, `lib/agent-prompts.ts`, `lib/market-ai.ts` | Prompt + deterministic local analysis router |
| `gem-trading-x` | same | Prompt + trading report template |
| Portfolio / gemstone / market-intelligence | same | In-process tool stubs |

There is **no** MetaQuant Sigma agent. There is **no** plugin manifest, workspace sandbox, or process runtime.

### 2.3 Technologies

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind, Framer Motion, Recharts, Radix
- **Backend:** Next.js API routes, Prisma → PostgreSQL, Redis
- **Auth / payments:** Clerk, Stripe, jose JWT
- **AI:** OpenAI Responses API + local deterministic fallback
- **Deploy:** Docker, Vercel-ready, OpenNext Sites packaging
- **Python / Rust / Tauri / DuckDB / Parquet / SQLCipher:** absent

### 2.4 Dependencies (high-level)

Pinned via `package-lock.json`. Notable: `next@15`, `openai`, `@clerk/nextjs`, `stripe`, `@prisma/client`, `zod`, `vitest`. Secrets expected via `.env` (see `.env.example`).

---

## 3. Reusable Assets

| Asset | Reuse strategy |
|---|---|
| Macro-X system prompt (`lib/agent-prompts.ts`) | Seed `PromptRegistry` + Macro-X mock agent contracts |
| Anti-hallucination / provenance protocol | Map to Core claim types: FACT / CALCULATION / MODEL_ESTIMATE / INFERENCE / SCENARIO / UNKNOWN |
| Agent catalog metadata (`lib/data.ts`) | Inform `avalon-agent.json` placeholders (macro-x, gem-trade) |
| Tool name concepts (`avalonTools`) | Inform `AvalonToolRegistry` IDs (non-executable stubs until real tools) |
| Institutional dark UI language | Visual reference for Command Center (rebuild in Vite/React, not Next.js) |
| API surface documentation (`lib/api-status.ts`) | Conceptual only — local Core API is a separate contract on `127.0.0.1` |

**Do not reuse:** Clerk/Stripe cloud auth, Postgres Prisma models as Core DB, Redis, OpenAI direct calls from agents, Next.js API routes as Privilege Broker.

---

## 4. Problems Relative to Target Platform

1. **Trust model inverted:** LLM/tools run in the same Node process as the web server; no OS isolation.
2. **Secrets in env plaintext:** `OPENAI_API_KEY`, JWT, Stripe keys — incompatible with Secure Vault law.
3. **No deny-by-default permissions:** agents are prompt routers, not sandboxed processes.
4. **No local offline runtime:** product assumes network SaaS.
5. **No encrypted local persistence:** PostgreSQL remote DB.
6. **Monolith coupling:** business agent logic lives inside the web app.

---

## 5. Architectural Conflicts

| Existing | Target | Resolution |
|---|---|---|
| Next.js cloud SaaS | Tauri local OS for agents | Coexist: keep SaaS; add desktop Core monorepo trees |
| Postgres | SQLCipher `avalon_core.db` | Separate stores; no shared schema |
| OpenAI from API route | `AvalonLLMGateway` local-first | Agents call gateway only |
| Prompt-as-agent | Manifest + runtime process | New runtime; prompts versioned in PromptRegistry |
| Root package = web app | Monorepo `apps/desktop` + `core/*` | Preserve root web scripts; add workspace crates/packages |

---

## 6. Security Risks (current web)

| Risk | Severity | Notes |
|---|---|---|
| API keys in environment | High for desktop port | Must never migrate to Core config files |
| Agent endpoints without local auth model | Medium | Web uses Clerk optionally; Core needs IPC auth |
| Deterministic “agents” can be mistaken for secured runtime | Medium | Document clearly as SaaS demos only |
| No audit ledger / tamper-evident logs | High vs Core goals | Net-new in Core |

---

## 7. Required Migrations (conceptual)

1. Extract Macro-X / Gem-Trade **contracts** (prompts, tool IDs, event names) into `packages/contracts` and agent manifests — **not** business logic into Kernel.
2. Introduce MetaQuant Sigma as **NOT_INSTALLED** placeholder.
3. Keep web SaaS deployable; Core becomes the Windows-local execution environment.
4. No database cutover from Prisma → SQLCipher (different products).

---

## 8. Git State at Audit

- Branch base: `main`
- Working branch: `cursor/avalon-agentique-platform-core-14e5`
- No Rust/Python trees present at audit time
- No `AGENTS.md` at repository root

---

## 9. Conclusion

The repository contains a **valuable institutional web product and agent prompt IP**, but **zero** of the Avalon Agentique Platform-Core runtime. Platform-Core must be built as a new Windows-first monorepo subsystem while **preserving** the existing Avalon Capital web application.
