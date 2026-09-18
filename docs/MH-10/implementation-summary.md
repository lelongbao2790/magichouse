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
