# NFR Design Patterns — Unit 1: SupabaseDBLayer

## Resilience Pattern: Idempotent Migration SQL

**Decision**: Q1 = A — `IF NOT EXISTS` guards on all DDL statements.

### Table Creation
```sql
CREATE TABLE IF NOT EXISTS players ( ... );
CREATE TABLE IF NOT EXISTS stickers ( ... );
CREATE TABLE IF NOT EXISTS player_stickers ( ... );
CREATE TABLE IF NOT EXISTS creative_canvas ( ... );
CREATE TABLE IF NOT EXISTS quiz_history ( ... );
```

### Index Creation
```sql
CREATE INDEX IF NOT EXISTS idx_player_stickers_player_id ON player_stickers(player_id);
CREATE INDEX IF NOT EXISTS idx_quiz_history_player_id ON quiz_history(player_id);
CREATE INDEX IF NOT EXISTS idx_quiz_history_completed_at ON quiz_history(completed_at DESC);
```

### Policy Creation
RLS policies are not natively idempotent — `CREATE POLICY` fails if the policy already exists.
Pattern: drop-then-create for idempotent policy management.

```sql
-- Enable RLS (idempotent by default)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Drop before create to make policy creation idempotent
DROP POLICY IF EXISTS "players_self_only" ON players;
CREATE POLICY "players_self_only" ON players
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "player_stickers_self_only" ON player_stickers;
CREATE POLICY "player_stickers_self_only" ON player_stickers
  FOR ALL USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "creative_canvas_self_only" ON creative_canvas;
CREATE POLICY "creative_canvas_self_only" ON creative_canvas
  FOR ALL USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "quiz_history_self_only" ON quiz_history;
CREATE POLICY "quiz_history_self_only" ON quiz_history
  FOR ALL USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "stickers_read_authenticated" ON stickers;
CREATE POLICY "stickers_read_authenticated" ON stickers
  FOR SELECT USING (auth.role() = 'authenticated');
```

**Rationale**: Supabase CLI migration tracking (`supabase_migrations` table) prevents normal
re-runs. IF NOT EXISTS / drop-then-create adds a safety layer for manual recovery scenarios
where partial failure left some objects created.

---

## Performance Pattern: Selective FK Indexing

PostgreSQL auto-indexes primary keys and unique constraints. Explicit indexes added only on
FK columns with high query frequency:

| Index | Table | Column | Query Pattern |
|---|---|---|---|
| `idx_player_stickers_player_id` | `player_stickers` | `player_id` | Fetch all stickers for a player |
| `idx_quiz_history_player_id` | `quiz_history` | `player_id` | Fetch all history for a player |
| `idx_quiz_history_completed_at` | `quiz_history` | `completed_at DESC` | Latest history first |

`creative_canvas.player_id` is the PK — auto-indexed, no extra index needed.

**Target**: All player-scoped lookups < 20 ms p99 (see nfr-requirements.md).

---

## Security Pattern: Row-Level Security (Least Privilege Per Player)

All player-data tables enforce RLS so no row can be read or written by anyone other than
the owning player. The `stickers` catalog is read-only for any authenticated user.

| Table | Policy | Operation | Condition |
|---|---|---|---|
| `players` | `players_self_only` | ALL | `auth.uid() = id` |
| `player_stickers` | `player_stickers_self_only` | ALL | `auth.uid() = player_id` |
| `creative_canvas` | `creative_canvas_self_only` | ALL | `auth.uid() = player_id` |
| `quiz_history` | `quiz_history_self_only` | ALL | `auth.uid() = player_id` |
| `stickers` | `stickers_read_authenticated` | SELECT | `auth.role() = 'authenticated'` |

**Service role bypass**: API routes use the service role key (`SUPABASE_SERVICE_ROLE_KEY`)
which bypasses RLS — application-layer auth check (`supabase.auth.getUser()`) takes its
place in Units 2–3.

**SECURITY-06 compliance**: Confirmed compliant — least-privilege enforced at DB level.

---

## Security Pattern: HTTP Security Headers (SECURITY-04)

Implemented in `next.config.ts` via the `headers()` async function. Applied to all routes
(`source: "/(.*)"`) so every Next.js response carries the full header set.

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

**SECURITY-04 compliance**: Confirmed compliant.

---

## Reliability Pattern: Seed Idempotency

```sql
INSERT INTO stickers (id, name, category, emoji, price) VALUES
  ('hat-crown', 'Crown', 'hat', '👑', 50),
  -- ... all 22 stickers ...
ON CONFLICT (id) DO NOTHING;
```

`ON CONFLICT (id) DO NOTHING` makes every seed run safe — no duplicates, no errors on
re-run after `supabase db reset`.

---

## Trigger Pattern: Automatic `updated_at` Maintenance

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
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Applied to `players` only — the only table where `updated_at` carries business meaning
(profile update tracking). `creative_canvas.updated_at` is set explicitly by the API.
