# AGENTS.md

## Cursor Cloud specific instructions

Avalon Capital is a single **Next.js 15** app (React 19, TypeScript, Tailwind). There is one service: the Next.js dev server. Standard commands live in `package.json` `scripts` — use those (`npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`).

### Runs fully offline — no external services required
Despite the stack list in `README.md` (Postgres, Redis, Clerk, Stripe, OpenAI), none are required to run, build, or demo the app in dev:
- `lib/prisma.ts` and `lib/redis.ts` define clients but **no route or page imports them at runtime**. All page/API data comes from static fixtures in `lib/data.ts`, and AI answers come from the local deterministic engine in `lib/market-ai.ts`.
- OpenAI, Stripe, and Clerk all degrade gracefully when unconfigured (`lib/api-status.ts`, `components/optional-clerk-provider.tsx`). `/api/market-ai` returns a structured local fallback analysis when OpenAI is absent or errors.
- Prisma is only needed at **build/typecheck** time (because `lib/prisma.ts` imports `@prisma/client`), which is why the update script runs `prisma generate`.

### Build gotcha: never use a fake Clerk key
`next build` statically prerenders `/administration`, which triggers Clerk key-format validation. A placeholder like `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_replace_me"` (the value shipped in `.env.example`) makes `next build` **fail**. For dev/build, either leave `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` empty (runs in "public pages only" mode) or use a real Clerk key. `.env` is gitignored, so copy `.env.example` to `.env` and blank the two `CLERK_*` keys if you need a `.env`. The dev server also works with no `.env` at all.

### Notes
- Dev server: `npm run dev` → http://localhost:3000.
- `npm run build` also runs `scripts/prepare-sites-dist.mjs`, which emits a static "Sites" dist after `next build`.
- `npm test` runs a single vitest file (`tests/market-ai.test.ts`) in node environment.
