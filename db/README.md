# Valor Claims OS Database

- Apply schema: `db/migrations/0001_init_schema.sql`
- Apply seed: `db/seeds/seed.sql`

For Supabase CLI use:

```bash
supabase db push
psql "$SUPABASE_DB_URL" -f db/seeds/seed.sql
```
