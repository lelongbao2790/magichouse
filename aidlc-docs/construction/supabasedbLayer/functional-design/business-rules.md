# Business Rules — Unit 1: SupabaseDBLayer

## Row-Level Security (RLS) Policies

RLS is enabled on all 5 tables. API routes use the **service role key** which bypasses RLS — these policies act as a defense-in-depth layer for any direct DB access.

### Table: players

| Policy | Command | Using Expression |
|---|---|---|
| Players can read own row | SELECT | `auth.uid() = id` |
| Players can update own row | UPDATE | `auth.uid() = id` |

No INSERT policy via RLS — rows are inserted by the service role key in the signup API route.

### Table: stickers

| Policy | Command | Using Expression |
|---|---|---|
| Authenticated users can read catalog | SELECT | `auth.role() = 'authenticated'` |

No INSERT/UPDATE/DELETE via RLS — the catalog is seeded via service role only; never mutated by the application at runtime.

### Table: player_stickers

| Policy | Command | Using Expression |
|---|---|---|
| Players can read own stickers | SELECT | `auth.uid() = player_id` |
| Players can insert own stickers | INSERT | `auth.uid() = player_id` |

No UPDATE or DELETE via RLS — sticker ownership is permanent once purchased.

### Table: creative_canvas

| Policy | Command | Using Expression |
|---|---|---|
| Players can read own canvas | SELECT | `auth.uid() = player_id` |
| Players can insert own canvas | INSERT | `auth.uid() = player_id` |
| Players can update own canvas | UPDATE | `auth.uid() = player_id` |

### Table: quiz_history

| Policy | Command | Using Expression |
|---|---|---|
| Players can read own history | SELECT | `auth.uid() = player_id` |
| Players can insert own history | INSERT | `auth.uid() = player_id` |

Records are append-only — no UPDATE or DELETE via RLS.

---

## Database Constraints

### players
- `coins >= 0` — prevents negative balances at DB level (defense in depth)
- `name IS NOT NULL` — player must always have a name

### stickers
- `price > 0` — all stickers cost at least 1 coin
- `category IN ('hat','glasses','bow','toy')` — validates category enum

### player_stickers
- `PRIMARY KEY (player_id, sticker_id)` — enforces one ownership record per sticker per player

### quiz_history
- `score >= 0` — non-negative score
- `total_questions > 0` — quiz must have at least one question
- `coins_earned >= 0` — non-negative reward
- `category IN ('shapes','colors','animals','math','vietnamese','english','addition','subtraction','timesTable')` — validates category

---

## Cascade Delete Rules

When a player's `auth.users` row is deleted:
1. `players` row deleted (FK: `players.id REFERENCES auth.users(id) ON DELETE CASCADE`)
2. `player_stickers` rows deleted (FK: `player_stickers.player_id REFERENCES players(id) ON DELETE CASCADE`)
3. `creative_canvas` row deleted (FK: `creative_canvas.player_id REFERENCES players(id) ON DELETE CASCADE`)
4. `quiz_history` rows deleted (FK: `quiz_history.player_id REFERENCES players(id) ON DELETE CASCADE`)

The `stickers` catalog is not affected by player deletion (it is independent static data).

---

## Trigger: updated_at Maintenance

A PostgreSQL trigger function updates `players.updated_at` automatically on every UPDATE:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Seed Data Rules

- Seed inserts all 22 stickers into the `stickers` table
- Uses `ON CONFLICT (id) DO NOTHING` — idempotent; safe to re-run
- Seed runs after migration via `supabase/seed.sql`
- Seed is only for the `stickers` catalog — player data is never seeded

---

## HTTP Security Headers (SECURITY-04)

Required headers added to all HTML-serving endpoints via `next.config.ts`:

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

**Note on CSP**: `unsafe-inline` is temporarily required for Next.js 16 styles; this is documented as a known limitation. Remove when Next.js supports nonce-based CSP natively.

---

## Type Generation Rule

After applying the migration:
```bash
supabase gen types typescript --project-id eoelyqphaixgqlkyoxau --schema public > lib/database.types.ts
```

The generated file is committed to version control and must be regenerated whenever the schema changes.
