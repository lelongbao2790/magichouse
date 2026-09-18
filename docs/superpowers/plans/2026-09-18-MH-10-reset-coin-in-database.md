# MH-10: Reset Coin in Database — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Supabase migration that atomically resets every row's `coins` column in the `players` table to `0`.

**Architecture:** A single SQL `UPDATE` statement in a new migration file resets all `coins` values. No application code changes are needed — the migration is applied via `supabase db push` and is idempotent by nature (setting a column to a constant is always safe to re-run).

**Tech Stack:** PostgreSQL 17, Supabase CLI (`supabase db push`), SQL migration files under `supabase/migrations/`

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Create | `supabase/migrations/0006_reset_player_coins.sql` | Migration that sets `coins = 0` for all rows in `players` |
| Create | `docs/MH-10/implementation-summary.md` | Implementation notes for this ticket |

No application code, API routes, or UI components are changed. The migration touches only the `coins` column of the `players` table.

---

### Context: `players` table schema (from migration `0001_initial_schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS players (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  coins       integer     NOT NULL DEFAULT 0 CHECK (coins >= 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

The `coins` column is `integer NOT NULL DEFAULT 0 CHECK (coins >= 0)`. Resetting it to `0` satisfies the check constraint.

---

### Migration file conventions (from existing migrations)

Each migration file follows this header pattern:

```sql
-- =============================================================================
-- Migration: <filename>.sql
-- Project:   magichouse
-- Purpose:   <one-line description>
-- =============================================================================
```

Migrations use idempotent SQL patterns where possible.

---

## Task 1: Create the reset-coins migration

**Files:**
- Create: `supabase/migrations/0006_reset_player_coins.sql`

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/0006_reset_player_coins.sql` with the following content:

```sql
-- =============================================================================
-- Migration: 0006_reset_player_coins.sql
-- Project:   magichouse
-- Purpose:   MH-10 — Reset every player's coin balance to 0.
--
-- Resets the `coins` column to 0 for all rows in the `players` table.
-- This is idempotent: running it a second time leaves every row at coins = 0
-- with no error, since the CHECK constraint (coins >= 0) is satisfied by 0.
-- No other columns are modified.
-- =============================================================================

UPDATE players
SET coins = 0;
```

- [ ] **Step 2: Verify the file was created correctly**

```bash
cat supabase/migrations/0006_reset_player_coins.sql
```

Expected output: The file contents above, with no extra characters.

- [ ] **Step 3: Commit the migration file**

```bash
git add supabase/migrations/0006_reset_player_coins.sql
git commit -m "feat(MH-10): add migration to reset all player coins to 0"
```

---

## Task 2: Verify the migration applies correctly

> This task validates all acceptance criteria by running the migration against a local Supabase instance.
>
> **Prerequisites:** Supabase CLI installed (`supabase --version`). Local Supabase stack running (`supabase start`).

**Files:**
- No files modified — this is a verification-only task.

- [ ] **Step 1: Start the local Supabase stack (if not already running)**

```bash
supabase start
```

Expected: Output ends with a table of service URLs including `API URL`, `DB URL`, `Studio URL`. If already running, this is a no-op.

- [ ] **Step 2: Reset the local database to apply all migrations in order**

```bash
supabase db reset
```

Expected output includes:
```
Resetting local database...
Applying migration 0001_initial_schema.sql...
Applying migration 0002_subject_content_schema.sql...
Applying migration 0003_subject_content_seed.sql...
Applying migration 0004_house_items_schema.sql...
Applying migration 0005_increment_coins_rpc.sql...
Applying migration 0006_reset_player_coins.sql...
Seeding data supabase/seed.sql...
Finished supabase db reset.
```

No errors should appear. If migration `0006` fails, check the SQL syntax in the file.

- [ ] **Step 3: Insert test rows with non-zero coins (to confirm the migration resets them)**

Connect to the local database and insert test players with non-zero coin balances. The local DB is at `postgresql://postgres:postgres@localhost:54322/postgres`.

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
INSERT INTO auth.users (id, email)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'test1@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'test2@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO players (id, name, coins)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'TestPlayer1', 500),
  ('00000000-0000-0000-0000-000000000002', 'TestPlayer2', 999)
ON CONFLICT (id) DO UPDATE SET coins = EXCLUDED.coins;
"
```

Expected: `INSERT 0 2` (or similar row-count output). No errors.

- [ ] **Step 4: Apply the migration manually to simulate `supabase db push`**

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/migrations/0006_reset_player_coins.sql
```

Expected output:
```
UPDATE 2
```

The number reported is the count of rows updated (matches the number of players rows in the database).

- [ ] **Step 5: Query the players table to verify all coins are 0**

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT id, name, coins FROM players;"
```

Expected: Every row has `coins = 0`. No row should have a non-zero value.

Example expected output:
```
                  id                  |    name      | coins 
--------------------------------------+--------------+-------
 00000000-0000-0000-0000-000000000001 | TestPlayer1  |     0
 00000000-0000-0000-0000-000000000002 | TestPlayer2  |     0
(2 rows)
```

- [ ] **Step 6: Verify idempotency — apply the migration a second time**

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/migrations/0006_reset_player_coins.sql
```

Expected output: `UPDATE 2` (or however many rows exist) — no error. Query the table again to confirm coins are still `0`:

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT id, name, coins FROM players;"
```

Expected: All rows still show `coins = 0`.

- [ ] **Step 7: Verify no other columns were modified**

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT id, name, coins, created_at FROM players;"
```

Expected: `id`, `name`, and `created_at` match the values from Step 3. Only `coins` changed (to `0`).

---

## Task 3: Create the implementation summary doc

**Files:**
- Create: `docs/MH-10/implementation-summary.md`

- [ ] **Step 1: Create the docs directory and file**

```bash
mkdir -p docs/MH-10
```

Then create `docs/MH-10/implementation-summary.md`:

```markdown
# MH-10: Reset Coin in Database — Implementation Summary

## What was done

Added Supabase migration `0006_reset_player_coins.sql` that resets every row's `coins`
column in the `players` table to `0`.

## Migration file

`supabase/migrations/0006_reset_player_coins.sql`

```sql
UPDATE players
SET coins = 0;
```

## How to apply

- **Local reset:** `supabase db reset` (runs all migrations in order)
- **Remote push:** `supabase db push` (applies only unapplied migrations)

## Idempotency

Running the migration more than once is safe. `UPDATE players SET coins = 0` always
leaves every row with `coins = 0` and never violates the `CHECK (coins >= 0)` constraint.

## Columns unaffected

Only `coins` is modified. `id`, `name`, `created_at`, and all other columns are unchanged.

## Testing notes

No application code, API routes, or UI components were changed. Verification is performed
by running `supabase db push` / `supabase db reset` and querying the `players` table.
```

- [ ] **Step 2: Commit the doc**

```bash
git add docs/MH-10/implementation-summary.md
git commit -m "docs(MH-10): add implementation summary"
```

---

## Self-Review

### Spec coverage

| Acceptance criterion | Covered by |
|----------------------|------------|
| New migration file under `supabase/migrations/` updating `coins` to `0` | Task 1 |
| `supabase db push` applies without errors | Task 2, Step 2 & 4 |
| Every row has `coins = 0` after migration | Task 2, Step 5 |
| No other user fields are modified | Task 2, Step 7 |
| Migration is idempotent | Task 2, Step 6 |
| `docs/MH-10/implementation-summary.md` created | Task 3 |

All acceptance criteria are covered. No gaps.

### Placeholder scan

No TBDs, TODOs, or vague steps. All commands are complete with exact connection strings, expected output, and SQL.

### Type consistency

Single migration file only — no cross-task type references needed.
