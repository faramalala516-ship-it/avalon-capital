# Avalon Capital

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
