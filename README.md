# Valor Claims OS

Production-oriented Next.js + Supabase platform for military career intelligence, VA claim optimization, transition workflows, and benefits discovery.

## Stack

- Next.js App Router + TypeScript
- Tailwind + premium dark design tokens
- Supabase (Auth, Postgres, Storage, RLS)
- OpenAI via centralized structured AI service layer
- Stripe billing scaffolding
- Vitest tests

## Architecture

- `app/`: route layer (marketing, auth, core app, API handlers)
- `features/`: UI feature modules (dashboard, onboarding, claims, transition)
- `services/`: deterministic business logic and integration services
- `ai/`: prompts, schemas, orchestration
- `db/`: SQL migrations and seed data
- `lib/`: env, supabase clients, analytics, security, billing helpers
- `tests/`: service/schema/permissions/RLS sanity tests

## Setup

1. Install dependencies: `npm install`
2. Copy envs: `cp .env.example .env.local` (PowerShell: `Copy-Item .env.example .env.local`)
3. Fill required variables.
4. Apply DB schema and seed:
   - `supabase db push`
   - `psql "$SUPABASE_DB_URL" -f db/seeds/seed.sql`
5. Run app: `npm run dev`

## Supabase

- Migration: `db/migrations/0001_init_schema.sql`
- Seed: `db/seeds/seed.sql`
- Storage buckets created by migration:
  - `medical-records`
  - `user-uploads`
  - `generated-exports`
  - `statement-assets`

## AI System

- Prompt versions live in `ai/prompts/index.ts`
- Structured schemas live in `ai/schemas/index.ts`
- Orchestration service in `ai/services.ts`
- Supported modules:
  - evidence gap detection
  - claim strategy generation
  - document extraction
- Deterministic scoring: `services/readiness-service.ts`

## Billing

- Stripe scaffolding in `services/billing-service.ts`
- Entitlement resolver in `lib/billing/entitlements.ts`
- Webhook endpoint scaffold: `app/api/billing/webhook/route.ts`

## Testing

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Deployment

### Vercel

- Configure all `.env.example` variables in Vercel project settings.
- Deploy with `vercel --prod`.

### Supabase

- Link project: `supabase link --project-ref <SUPABASE_PROJECT_REF>`
- Push schema: `supabase db push`

## Completion Notes

Implemented in this repository:
- Full route architecture across marketing/auth/onboarding/core/transition/claims/coach/admin/settings.
- Premium dark theme design system and dashboard shell.
- Core API endpoints for readiness and AI modules.
- Comprehensive relational schema with RLS policies.
- Storage buckets, AI/audit tables, billing events, and permissions entities.
- Test baseline for scoring, permissions, schemas, route guard, and RLS sanity.

Requires credentials to finalize live integrations:
- Supabase project keys and project ref
- OpenAI API key/model
- Stripe keys and price IDs
- Vercel project/org tokens
