# Deployment Checklist

## 1. Environment
- Populate `.env.local` from `.env.example`.
- Add same variables to Vercel + Supabase secrets.

## 2. Database
- `supabase link --project-ref $SUPABASE_PROJECT_REF`
- `supabase db push`
- seed with `db/seeds/seed.sql`
- ensure migrations include:
  - `db/migrations/0001_init_schema.sql`
  - `db/migrations/0002_settings_and_claimbuilder_extensions.sql`
  - `db/migrations/0003_transition_task_extensions.sql`
  - `db/migrations/0004_analytics_events.sql`
  - `db/migrations/0005_security_exports_extensions.sql`
  - `db/migrations/0006_organization_invites.sql`

## 3. App Validation
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 4. Stripe
- Configure webhook endpoint:
  - Production: `https://provaryn.vercel.app/api/billing/webhook`
  - Preview: `https://<your-preview-domain>/api/billing/webhook`
- Set Stripe env vars:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_PRICE_RECON_UNLOCK`
  - `STRIPE_PRICE_PREMIUM`
  - `STRIPE_PRICE_CLAIM_BUILDER`
- Checkout route is `/api/billing/checkout` and billing page uses it directly.

## 5. Release
- Deploy frontend to Vercel.
- Validate auth redirects and RLS-protected data paths.
- Run smoke test across onboarding, vault upload, strategy, transition, settings.
