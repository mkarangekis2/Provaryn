# Deployment Checklist

## 1. Environment
- Populate `.env.local` from `.env.example`.
- Add same variables to Vercel + Supabase secrets.

## 2. Database
- `supabase link --project-ref $SUPABASE_PROJECT_REF`
- `supabase db push`
- seed with `db/seeds/seed.sql`

## 3. App Validation
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 4. Stripe
- Configure webhook endpoint `/api/billing/webhook`.
- Add Stripe price IDs for reconstruction unlock, premium, claim builder.

## 5. Release
- Deploy frontend to Vercel.
- Validate auth redirects and RLS-protected data paths.
- Run smoke test across onboarding, vault upload, strategy, transition, settings.
