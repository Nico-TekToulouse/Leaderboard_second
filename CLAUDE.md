# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Contexte du projet

Application web de **leaderboard** pour 120 élèves de seconde répartis en **4 factions** pendant 2 semaines de stage à Epitech. Chaque jour, des activités font gagner des points aux factions.

### Fonctionnalités
- Leaderboard global classant les 4 factions par points
- Vue détaillée par faction
- Feed des activités avec les points marqués
- Planning de la semaine + ressources associées
- Page de liens utiles
- Interface admin protégée (Supabase Auth) pour ajouter/modifier les points

### Stack
- **Base de données** : Supabase (PostgreSQL + Realtime)
- **Auth** : Supabase Auth (admin uniquement)
- **Déploiement** : Vercel

### Modèle de données
- `factions` (id, name, color, logo)
- `activities` (id, name, description, date, max_points)
- `scores` (id, faction_id, activity_id, points, created_at)
- `planning` (id, day, time, activity_name, description)
- `resources` (id, title, url, type)

### Structure cible de `src/`
```
app/
├── page.tsx              # Leaderboard global
├── faction/[id]/         # Vue par faction
├── planning/             # Planning + ressources
├── links/                # Liens utiles
└── admin/                # Interface admin (protégée)
components/
├── FactionCard.tsx
├── ActivityFeed.tsx
└── Leaderboard.tsx
lib/
└── supabase.ts
```

### Contraintes
- Scores mis à jour après chaque activité via l'interface admin
- Affichage temps réel via Supabase Realtime
- Interface simple et engageante pour des lycéens

## Commands

This project uses **pnpm** as the package manager.

```bash
pnpm dev       # Start development server
pnpm build     # Build for production
pnpm start     # Start production server
pnpm lint      # Run ESLint
```

There is no test framework configured in this project.

## Architecture

This is a **Next.js 16.2.1** project using the **App Router** with TypeScript and React 19.

Key architectural choices:
- **React Compiler** is enabled (`reactCompiler: true` in `next.config.ts`) — do not manually add `useMemo`/`useCallback` optimizations; the compiler handles them.
- **App Router only** — all routes live under `src/app/`. There is no `pages/` directory.
- Path alias `@/*` maps to `src/*`.

### Next.js version note

This project uses Next.js **16.2.1**, which may have breaking changes from versions in your training data. Before writing any Next.js-specific code (routing, data fetching, middleware, etc.), read the relevant guide in `node_modules/next/dist/docs/`. The docs are organized as:
- `01-app/` — App Router guides and API reference
- `02-pages/` — Pages Router (not used here)
- `03-architecture/` — internals

### obligation
- Toujours créer des type custom pour chaque composant, paramètre et valeur de retour !
- Si tu as besoin d'avoir les nom des variables d'environnement, tu dois lire le fichier `.env.example` !

### interdiction
- Lire le `.env`
- Ne pas utiliser de type `any`, `unknow` ou `never`