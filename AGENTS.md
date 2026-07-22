# AGENTS.md

## Cursor Cloud specific instructions

Avalon Capital is a single Next.js 15 (App Router) app (see `README.md` for the product overview and page list). Commands live in `package.json` scripts; the notes below only cover non-obvious caveats for running it in this environment.

### Services / dependencies

- There is only one service: the Next.js app (`npm run dev`, serves on `http://localhost:3000`).
- Postgres and Redis are declared in `docker-compose.yml` and `prisma/schema.prisma`, but **no route or component actually imports `lib/prisma.ts` or `lib/redis.ts` at runtime** — all page/API data comes from the in-memory `lib/data.ts` and deterministic engines in `lib/market-ai.ts`. So you do **not** need Postgres/Redis running to develop, run, lint, typecheck, test, or build. Skip `docker compose up` and `npm run prisma:migrate` unless you add code that uses the DB.
- `npm run prisma:generate` is still required (for the generated `@prisma/client` types that `lib/prisma.ts` imports) so that `typecheck` and `build` pass. The update script runs this.

### `.env` is required and must have EMPTY Clerk keys

The app reads `.env` (git-ignored). Copying `.env.example` verbatim **breaks the home page** because `OptionalClerkProvider` only skips Clerk when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is unset/empty; the example's placeholder `pk_test_replace_me` is treated as a real (invalid) key and makes `/` return HTTP 500.

For local dev without real credentials, ensure `.env` exists with the Clerk keys left empty (this puts the app in "local public pages only" mode). Leaving `OPENAI_API_KEY` empty is also intended: `/api/market-ai` then uses the local deterministic analysis engine. If `.env` is missing, create it from `.env.example` but blank out `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and (for clean fallback) `OPENAI_API_KEY` / `STRIPE_*`.

### Do not run `npm run build` while `npm run dev` is running

Both write to `.next/`. Running the production `build` while the dev server is live corrupts the dev cache (symptom: runtime "Cannot find module './<chunk>.js'" errors in the browser). Recovery: stop dev, `rm -rf .next`, then restart `npm run dev`. Run dev and build at separate times.

### Commands (from `package.json`)

- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Test: `npm test` (vitest, single file `tests/market-ai.test.ts`)
- Dev: `npm run dev`
- Build: `npm run build` (runs `prisma generate && next build`, then `scripts/prepare-sites-dist.mjs` to produce `dist/` for static Sites hosting)

CI (`.github/workflows/ci.yml`) runs install → prisma generate → typecheck → lint → build.
