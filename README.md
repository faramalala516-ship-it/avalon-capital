# Gem'StonEye'Shootin'Gallery

Galerie européenne de photographies de minerais de Madagascar — expositions, foires aux minerais, livres & magazines de gemmologie, tableaux Fine Art pour collectionneurs.

**Domaine :** [www.gemstoneyeshootingallery.com](https://www.gemstoneyeshootingallery.com)

## Pages

1. **Présentation** (`/`) — identité de la galerie et collection du mois
2. **Galerie shooting** (`/galerie`) — meilleures collections du mois + archives
3. **Espace personnel** (`/espace`) — inscription e-mail, achats, badges, abonnement
4. **Salle des enchères** (`/salle-encheres`) — privée, abonnés uniquement

## Fonctionnalités

- Concierge IA (gemmologie + photographie) avec repli local sans clé OpenAI
- Formats d'image licenciés (éditorial, expo, Fine Art, livre)
- Protection aperçus (filtre, anti-clic droit, anti-capture basique)
- Certificat blockchain GSES-Ledger + QR d'appartenance après vente
- Paiement par virement bancaire international (SEPA / SWIFT)

## Stack

- Next.js 15, React 19, TypeScript, TailwindCSS, Framer Motion
- Prisma / PostgreSQL (schéma galerie), Redis optionnel
- OpenAI Responses API pour le concierge (fallback local)

## Démarrage

```bash
npm install
cp .env.example .env
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).
