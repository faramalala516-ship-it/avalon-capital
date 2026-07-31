# Avalon Capital / Avalon Agentique Platform

This repository contains two related products:

1. **Avalon Capital Web SaaS** (existing) — Next.js institutional research site at the repository root (`app/`, `lib/`, …).
2. **Avalon Agentique Platform-Core** (new) — Windows-first local OS for Avalon AI agents (`apps/desktop`, `core/`, `services/`, `agents/`).

## Platform-Core quick start

```bash
# Tests (Core)
chmod +x scripts/*.sh
./scripts/test.sh

# Run Core local API on 127.0.0.1:8741
./scripts/dev.sh /tmp/avalon-dev

# Desktop UI (Vite) against local API
cd apps/desktop && npm install && npm run dev
```

Windows packaging: `scripts/build.ps1 -Installer` (requires WebView2 + Tauri).  
CI: `.github/workflows/avalon-platform-core.yml` builds Linux Core tests + Windows NSIS/MSI artifacts.

Documentation: `docs/` — start with `docs/TARGET_ARCHITECTURE.md`, `docs/INSTALLATION.md`, `docs/WINDOWS_CI_PACKAGING.md`.

Build report: `AVALON_CORE_BUILD_REPORT.md`.

---

# Avalon Capital (Web)

Avalon Capital est une plateforme web institutionnelle d'analyse financiere assistee par IA: market intelligence, recherche macro, scanner trading, portefeuille intelligent et diversification en pierres precieuses.

## Stack

- Next.js 15, React 19, TypeScript
- TailwindCSS, Framer Motion, shadcn-style UI primitives, Recharts
- Next.js API routes, PostgreSQL, Prisma, Redis
- Clerk, JWT service tokens, Google OAuth via Clerk, Stripe
- OpenAI Responses API avec Structured Outputs
- Docker, Vercel-ready, GitHub Actions
- Hooks React Query dans `hooks/use-avalon-data.ts`

## Demarrage

```bash
npm install
cp .env.example .env
docker compose up -d postgres redis
npm run prisma:migrate
npm run dev
```

Sans cle OpenAI, `/api/market-ai` utilise un moteur local deterministe pour que l'application reste executable en developpement.

## Pages

Accueil, Presentation, Tarifs, Connexion, Inscription, Dashboard, Weekly Research, Market Intelligence, Trading Scanner, Macro Dashboard, Portefeuille IA, Calendrier economique, News, Gem Investment, Formation, Profil et Administration.
