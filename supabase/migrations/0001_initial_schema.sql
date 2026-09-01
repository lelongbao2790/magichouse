-- =============================================================================
-- Migration: 0001_initial_schema.sql
-- Project:   magichouse (eoelyqphaixgqlkyoxau)
-- IF NOT EXISTS guards make all DDL idempotent for manual re-run safety.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS players (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  coins       integer     NOT NULL DEFAULT 0 CHECK (coins >= 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stickers (
  id        text    PRIMARY KEY,
  name      text    NOT NULL,
  category  text    NOT NULL CHECK (category IN ('hat', 'glasses', 'bow', 'toy')),
  emoji     text    NOT NULL,
  price     integer NOT NULL CHECK (price > 0)
);

CREATE TABLE IF NOT EXISTS player_stickers (
  player_id    uuid        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  sticker_id   text        NOT NULL REFERENCES stickers(id),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, sticker_id)
);

CREATE TABLE IF NOT EXISTS creative_canvas (
  player_id   uuid  PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  canvas_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_history (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       uuid        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  category        text        NOT NULL CHECK (category IN (
                                'shapes', 'colors', 'animals', 'math', 'vietnamese',
                                'english', 'addition', 'subtraction', 'timesTable'
                              )),
  score           integer     NOT NULL CHECK (score >= 0),
  total_questions integer     NOT NULL CHECK (total_questions > 0),
  coins_earned    integer     NOT NULL CHECK (coins_earned >= 0),
  completed_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes (FK columns not auto-indexed by PostgreSQL)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_player_stickers_player_id
  ON player_stickers(player_id);

CREATE INDEX IF NOT EXISTS idx_quiz_history_player_id
  ON quiz_history(player_id);

CREATE INDEX IF NOT EXISTS idx_quiz_history_completed_at
  ON quiz_history(completed_at DESC);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE players          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stickers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stickers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_canvas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_history     ENABLE ROW LEVEL SECURITY;

-- players: read + update own row only (INSERT done by service role at signup)
DROP POLICY IF EXISTS "players_select_own" ON players;
CREATE POLICY "players_select_own" ON players
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "players_update_own" ON players;
CREATE POLICY "players_update_own" ON players
  FOR UPDATE USING (auth.uid() = id);

-- stickers: any authenticated user can read the catalog (read-only catalog)
DROP POLICY IF EXISTS "stickers_select_authenticated" ON stickers;
CREATE POLICY "stickers_select_authenticated" ON stickers
  FOR SELECT USING (auth.role() = 'authenticated');

-- player_stickers: players can read and insert their own rows (no update/delete)
DROP POLICY IF EXISTS "player_stickers_select_own" ON player_stickers;
CREATE POLICY "player_stickers_select_own" ON player_stickers
  FOR SELECT USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "player_stickers_insert_own" ON player_stickers;
CREATE POLICY "player_stickers_insert_own" ON player_stickers
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- creative_canvas: players can read, insert, and update their own canvas
DROP POLICY IF EXISTS "creative_canvas_select_own" ON creative_canvas;
CREATE POLICY "creative_canvas_select_own" ON creative_canvas
  FOR SELECT USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "creative_canvas_insert_own" ON creative_canvas;
CREATE POLICY "creative_canvas_insert_own" ON creative_canvas
  FOR INSERT WITH CHECK (auth.uid() = player_id);

DROP POLICY IF EXISTS "creative_canvas_update_own" ON creative_canvas;
CREATE POLICY "creative_canvas_update_own" ON creative_canvas
  FOR UPDATE USING (auth.uid() = player_id);

-- quiz_history: append-only (select + insert; no update or delete)
DROP POLICY IF EXISTS "quiz_history_select_own" ON quiz_history;
CREATE POLICY "quiz_history_select_own" ON quiz_history
  FOR SELECT USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "quiz_history_insert_own" ON quiz_history;
CREATE POLICY "quiz_history_insert_own" ON quiz_history
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- ---------------------------------------------------------------------------
-- Trigger: auto-update players.updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS players_updated_at ON players;
CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
