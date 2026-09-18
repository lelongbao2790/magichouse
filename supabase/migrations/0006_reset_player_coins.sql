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
