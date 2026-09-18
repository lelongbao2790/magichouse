-- =============================================================================
-- Migration: 0005_increment_coins_rpc.sql
-- Project:   magichouse
-- Fix:       MH-7 v2 — atomic coin increment to eliminate race-condition coin loss
--
-- Replaces the non-atomic read-modify-write pattern in addCoins (lib/services/player.ts)
-- with a single SQL UPDATE expression `coins = coins + p_amount`, which is atomic at
-- the row level in PostgreSQL — no concurrent request can interleave between the read
-- and the write because there is no separate read step.
--
-- SECURITY DEFINER: the `players` RLS policy grants SELECT/UPDATE only on
-- `auth.uid() = id` rows, so a plain RLS-scoped UPDATE on `coins` would work — but
-- SECURITY DEFINER + explicit auth.uid() check is used here to stay consistent with
-- the purchase_house_item pattern (0004) and to future-proof against stricter RLS.
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_player_coins(
  p_player_id uuid,
  p_amount    integer
)
RETURNS TABLE (id uuid, name text, coins integer, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_player_id THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Single atomic UPDATE: `coins = coins + p_amount` is evaluated in one row-level
  -- operation by PostgreSQL — no separate SELECT is needed, so there is no window
  -- for a concurrent request to read the same stale value and produce coin loss.
  UPDATE players
    SET coins = coins + p_amount
  WHERE players.id = p_player_id;

  RETURN QUERY
    SELECT p.id, p.name, p.coins, p.created_at
    FROM players p
    WHERE p.id = p_player_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_player_coins(uuid, integer) TO authenticated;
