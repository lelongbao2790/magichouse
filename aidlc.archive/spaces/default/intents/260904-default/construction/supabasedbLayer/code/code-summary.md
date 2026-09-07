# Code Summary — Unit 1: SupabaseDBLayer

## Files Created

| File | Purpose |
|---|---|
| `supabase/migrations/0001_initial_schema.sql` | Full DB schema: 5 tables, 3 indexes, RLS, trigger |
| `supabase/seed.sql` | 22 sticker catalog rows (idempotent) |
| `lib/database.types.ts` | Pre-generated TypeScript types for all 5 tables |
| `.env.example` | Env var template (committed; no secrets) |

## Files Modified

| File | Change |
|---|---|
| `next.config.mjs` | Added `headers()` async function with 5 HTTP security headers |

---

## CLI Commands to Apply This Unit

### 1. Set up environment variables
```bash
cp .env.example .env.local
# Fill in values from Supabase Dashboard → Project Settings → API
```

### 2. Apply migration to remote database
```bash
npx supabase db push
# Expected: "Applying migration 0001_initial_schema.sql"
```

### 3. Apply seed data (run once)
```bash
# Via Supabase SQL editor: paste contents of supabase/seed.sql
# OR via CLI:
npx supabase db execute --file supabase/seed.sql
```

### 4. Regenerate TypeScript types (after migration applied)
```bash
npx supabase gen types typescript \
  --project-id eoelyqphaixgqlkyoxau \
  --schema public \
  > lib/database.types.ts
```

---

## Requirements Traceability

| Requirement | Implemented By |
|---|---|
| FR-02: Player profile in DB | `players` table |
| FR-03: Coins stored in DB | `players.coins` column + CHECK (coins >= 0) |
| FR-04: DB-driven sticker catalog | `stickers` table + `supabase/seed.sql` |
| FR-05 (schema): Sticker ownership | `player_stickers` table |
| FR-06: Creative Room canvas schema | `creative_canvas` table (JSONB canvas_data) |
| FR-07: Full quiz history schema | `quiz_history` table |
| SECURITY-04: HTTP security headers | `next.config.mjs` headers() |
| SECURITY-06: RLS least-privilege | 11 RLS policies across 5 tables |
| SECURITY-09: No default credentials | seed.sql is catalog-only; no PII |
| SECURITY-10: CLI version pinned | `supabase ^2.116.0` in devDependencies |

---

## Schema Overview

```
auth.users (Supabase-managed)
     | 1:1
     v
  players (id, name, coins, created_at, updated_at)
     |
     |--< player_stickers >-- stickers (catalog — seeded, immutable at runtime)
     |
     |-- creative_canvas (1:1 — canvas_data JSONB array)
     |
     |--< quiz_history (append-only)
```

---

## NFR Compliance

| NFR | Status |
|---|---|
| Migration idempotency (IF NOT EXISTS + DROP POLICY IF EXISTS) | Implemented |
| Seed idempotency (ON CONFLICT DO NOTHING) | Implemented |
| FK indexes for p99 < 20 ms lookups | 3 indexes created |
| RLS policies (per-operation granularity) | 11 policies across 5 tables |
| HTTP security headers (SECURITY-04) | 5 headers in next.config.mjs |
| Trigger: players.updated_at auto-refresh | Implemented |
