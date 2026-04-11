# GmbPro.fr

## Projet
SaaS automatise de SEO local / Google My Business. Scanner les fiches GMB "a la ramasse", prospecter les commercants, optimiser leurs fiches automatiquement, generer du contenu IA, gerer leur reputation.

## Stack
- Frontend: Next.js 15 + TypeScript + Tailwind CSS + Framer Motion
- Backend: Next.js API routes (landing) → VPS Node.js (workers)
- DB: PostgreSQL (Supabase dev → Hetzner VPS prod)
- Queue: Redis + BullMQ
- Scraping: Playwright
- IA: Claude API (posts GMB, reponses avis)
- Paiement: Stripe (fetch direct, pas de SDK)
- Email: Resend
- Hebergement: Vercel (landing) + Hetzner CCX23 (backend/workers)

## Design
- Ultra premium, niveau Awwwards
- Mentors: Gleb Kuznetsov, Zhenya Rynzhuk, Filippos Fragkogiannis
- Animations signature: Framer Motion, scroll-triggered, page transitions
- Typographie premium: serif titres + sans-serif corps
- Palette sombre pro avec accents

## Domaine
- gmbpro.fr (acquis)

## Forfaits
- Starter: 29 euros one-shot (audit + refonte fiche)
- Pro: 39 euros/mois (suivi SEO + posts GMB IA)
- Premium: 59 euros/mois (reputation: reponses avis + questions auto)

## Regles
- Prefixer toutes les env vars: GMBPRO_*
- API Google Maps 100% server-side
- Stripe via fetch direct (pas de SDK)
- Tester cross-device des le MVP
- SEO exemplaire (on vend du SEO)
