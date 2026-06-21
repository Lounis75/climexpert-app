# Architecture — ClimExpert (back-office CRM/ERP)

Document d'onboarding pour un développeur qui rejoint le projet.

## Pile technique

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind**.
- **Drizzle ORM** + **Neon Postgres** via le driver `drizzle-orm/neon-http`.
  - ⚠️ Ce driver **ne supporte pas les transactions interactives**. Les écritures
    multi-étapes ne sont pas atomiques (cf. `createClientFromLead`). En tenir compte.
- **Vercel** : hébergement serverless (auto-scale), déploiement auto sur push `main`.
- **Cloudflare R2** : stockage fichiers (photos, PDF) via `lib/r2.ts`.
- **pdfkit** : génération PDF serverless (contrats) — `serverExternalPackages: ["pdfkit"]`.

## ⚠️ Spécificités Next.js 16 (pas le Next que vous connaissez)

- Le « middleware » s'appelle désormais **`proxy.ts`** (et non `middleware.ts`).
  Il exporte une fonction `proxy()`. **Toute l'auth d'accès est là.**
- Avant d'écrire du code, lire `node_modules/next/dist/docs/` (cf. `AGENTS.md`).

## Authentification & rôles

- 3 espaces, chacun avec son **cookie JWT** (signés via `jose`, cf. `lib/auth.ts`) :
  - **admin** (`admin_token`) — accès total. Pages `/admin/**`, API `/api/admin/**`.
  - **technicien** (`tech_token`) — `/technicien/**`. Ne voit que SES interventions
    (`eq(interventions.technicienId, session.sub)`).
  - **commercial** (`commercial_token`) — `/commercial/**`. Ne voit que SES RDV/leads
    (`eq(leads.commercialId, session.sub)`).
- **`proxy.ts`** verrouille ces espaces (JWT valide exigé). Les chemins publics
  (login, activation) sont en correspondance **exacte** dans `ADMIN_PUBLIC` etc.
  → l'autorisation fine (rôle, compte actif) est faite dans la couche données.

## Organisation du code

- `app/` — routes (App Router). `app/admin`, `app/technicien`, `app/commercial`,
  `app/api/**` (handlers), pages publiques (site vitrine).
- `lib/` — **toute la logique métier et l'accès données** (`leads.ts`, `clients.ts`,
  `interventions.ts`, `contrats.ts`, `dashboard.ts`, `actions.ts`, `auth.ts`,
  `observability.ts`, `r2.ts`…). C'est ici qu'on travaille en priorité.
- `lib/db/schema.ts` — schéma Drizzle (tables + index). `lib/db/migrations/` — SQL.
- `components/` — composants partagés (`AdminHeader`, `MobileTabBar`, `admin-nav.ts`…).
- `proxy.ts` — garde d'accès. `instrumentation.ts` — capture des erreurs serveur.

## Domaines métier

`leads` (prospects, Kanban) → conversion en `clients` → `interventions` (terrain) /
`contrats_entretien` / `sav_tickets`. `suivis` = journal d'activité. `notifications`.
RGPD géré. Soft-delete (`supprimeLe`) sur les entités sensibles.

## Conventions

- Pages back-office : `export const dynamic = "force-dynamic"` (données fraîches).
- Accès données **toujours** via `lib/` (pas de requête Drizzle dans les composants).
- Ne **pas avaler** les erreurs : utiliser `logError(context, err, meta)` de
  `lib/observability.ts` (log structuré, prêt pour Sentry).
- Thème sombre (slate/sky) côté admin ; espaces salariés sombres aussi (accent violet).

## Commandes

```bash
npm run dev                         # développement
npm run build                       # build de prod (Vercel le fait à chaque push)
npx tsc --noEmit                    # vérification des types
npm test                            # tests (jest)
# Migrations (génère puis applique sur la base de .env.local) :
npx dotenv -e .env.local -- drizzle-kit generate --name=<nom>
npm run db:migrate
```

## Observabilité

- `instrumentation.ts` (`onRequestError`) capture les erreurs serveur non gérées.
- `lib/observability.ts` (`logError`/`logWarn`) pour les erreurs gérées (SERVEUR
  uniquement — charge `@sentry/node`).
- `/api/health` — point de contrôle (ping DB) pour une supervision externe.
- **Sentry est câblé** (via `@sentry/node`, pas le wrapper `@sentry/nextjs` qui casse
  sur Next 16). Il est **inactif tant que `SENTRY_DSN` n'est pas défini** (logs Vercel
  seulement). Pour l'activer : créer un projet Sentry → ajouter `SENTRY_DSN` dans les
  variables d'environnement Vercel. Aucune autre modif de code nécessaire.

## Tâches planifiées (crons Vercel — `vercel.json`)

- `/api/cron/garanties` (8h), `/api/cron/suivis` (9h), `/api/cron/sms-j365` (9h).

## Points d'attention connus (dette / scalabilité)

- **Pas de pagination** sur les listes (`getLeads`, `getClients`, `getInterventions`
  chargent tout) → à paginer avant un fort volume.
- **Agrégats dashboard calculés en mémoire** → passer en SQL (`GROUP BY`) à l'échelle.
- **Pas de verrou de version** (optimistic concurrency) → risque d'écrasement quand
  plusieurs salariés éditent en même temps.
- **Transactions absentes** (driver HTTP) → écritures multi-étapes non atomiques.
