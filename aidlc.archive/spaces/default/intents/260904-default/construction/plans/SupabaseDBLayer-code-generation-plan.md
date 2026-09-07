# Code Generation Plan — Unit 1: SupabaseDBLayer

## Unit Context
- **Unit**: SupabaseDBLayer
- **Phase**: CONSTRUCTION — Unit 1 of 4
- **Depends on**: Nothing (first unit)
- **Produces**: Schema, seed, types, and security config consumed by Units 2–4

## Stories Implemented
- FR-01 partial (auth table foundation via `auth.users` FK on `players`)
- FR-02: Player profile persisted in DB (`players` table)
- FR-03: Coins stored in DB (`players.coins`)
- FR-04: DB-driven sticker catalog (`stickers` table + seed)
- FR-05 partial: Sticker ownership schema (`player_stickers` table + RLS)
- FR-06: Creative Room canvas schema (`creative_canvas` table)
- FR-07: Full quiz history schema (`quiz_history` table)
- SECURITY-04: HTTP security headers via `next.config.mjs`
- SECURITY-06: RLS policies enforce least-privilege per player

## Files to Generate

| Step | File | Action |
|---|---|---|
| 1 | `supabase/migrations/0001_initial_schema.sql` | CREATE (new) |
| 2 | `supabase/seed.sql` | CREATE (new) |
| 3 | `lib/database.types.ts` | CREATE (new — pre-generated from known schema) |
| 4 | `next.config.mjs` | MODIFY (add `headers()` function) |
| 5 | `aidlc-docs/construction/SupabaseDBLayer/code/code-summary.md` | CREATE (new) |

---

## Steps

### Step 1 — `supabase/migrations/0001_initial_schema.sql`
- [x] Enable pgcrypto extension (`CREATE EXTENSION IF NOT EXISTS pgcrypto`)
- [x] CREATE TABLE IF NOT EXISTS: `players`, `stickers`, `player_stickers`, `creative_canvas`, `quiz_history`
- [x] All column types, defaults, CHECK constraints, and FK references as per domain-entities.md
- [x] CREATE INDEX IF NOT EXISTS: `idx_player_stickers_player_id`, `idx_quiz_history_player_id`, `idx_quiz_history_completed_at`
- [x] ALTER TABLE ENABLE ROW LEVEL SECURITY on all 5 tables
- [x] DROP POLICY IF EXISTS + CREATE POLICY for all RLS policies (per business-rules.md)
- [x] CREATE OR REPLACE FUNCTION `update_updated_at_column()` + CREATE TRIGGER `players_updated_at`

### Step 2 — `supabase/seed.sql`
- [x] INSERT INTO stickers: all 22 rows (id, name, category, emoji, price) from domain-entities.md seed table
- [x] ON CONFLICT (id) DO NOTHING for idempotency

### Step 3 — `lib/database.types.ts`
- [x] Write pre-generated TypeScript `Database` interface covering all 5 tables
- [x] Include `Tables`, `Insert`, `Update` helper types for each table
- [x] Add header comment: pre-generated from known schema; regenerate via CLI after applying migration

### Step 4 — `next.config.mjs` (MODIFY)
- [x] Read existing file first
- [x] Add async `headers()` function returning security headers for `source: "/(.*)"`:
  - Content-Security-Policy
  - Strict-Transport-Security
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Referrer-Policy: strict-origin-when-cross-origin
- [x] Preserve existing `typescript` and `images` config

### Step 5 — `aidlc-docs/construction/SupabaseDBLayer/code/code-summary.md`
- [x] List all created and modified files
- [x] Note CLI commands to apply migration, seed, and regenerate types
- [x] Requirements traceability matrix

---

## Total Steps: 5
## Files Created: 4 | Files Modified: 1
