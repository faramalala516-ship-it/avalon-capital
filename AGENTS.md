# AGENTS.md

## Cursor Cloud specific instructions

Avalon Capital is a single Next.js 15 (App Router) app — an AI-assisted financial
intelligence platform (French UI). There is one product, one `package.json`, one
Prisma schema. Node 22 is required (matches CI and the Dockerfile).

### Services

| Service | Required | How to run | Notes |
| --- | --- | --- | --- |
| Next.js dev server | Yes | `npm run dev` (port 3000) | This *is* the product (SSR pages + `app/api/**` route handlers). |
| PostgreSQL / Redis | No | `docker compose up -d postgres redis` | Defined in `prisma/schema.prisma` + `docker-compose.yml`, but **no runtime code imports `@/lib/prisma` or `@/lib/redis`** today. Only needed if you run `npm run prisma:migrate`. |
| OpenAI / Clerk / Stripe / Google | No | set the matching env vars | Third-party integrations; all degrade gracefully when unset (see below). |

### Environment variables (`.env`)

- `.env` is gitignored. Copying `.env.example` verbatim is **not** enough: its
  placeholder Clerk key (`pk_test_replace_me`) is non-empty, so `OptionalClerkProvider`
  mounts `<ClerkProvider>` and `next build` fails while prerendering `/connexion`
  with "The publishableKey passed to Clerk is invalid".
- For a keyless dev/build, leave the optional third-party keys **empty strings**
  (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""`, `OPENAI_API_KEY=""`, Stripe keys `""`, etc.).
  Empty = graceful degradation; a bad non-empty value = crash. Keep `DATABASE_URL`
  set (Prisma reads it) and `JWT_SECRET` set.
- With OpenAI unset, `POST /api/market-ai` returns a full structured analysis from the
  local deterministic engine (`lib/market-ai.ts`, `source: "local-fallback"`). With
  Clerk unset, auth pages (`/connexion`, `/inscription`, `/profil`) render a
  configuration notice instead of Clerk widgets.

### Commands (defined in `package.json`)

- `npm run dev` — dev server. `npm run lint`, `npm run typecheck`, `npm run test`
  (Vitest, single file `tests/market-ai.test.ts`).
- `npm run build` runs `prisma generate && next build` then
  `scripts/prepare-sites-dist.mjs` (emits `dist/` static pages + a fetch worker for
  OpenAI "Sites" hosting). `prisma generate` must run before any build.
- CI (`.github/workflows/ci.yml`): install → prisma generate → typecheck → lint → build.
