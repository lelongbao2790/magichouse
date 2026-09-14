-- =============================================================================
-- Migration: 0004_house_items_schema.sql
-- Project:   magichouse (eoelyqphaixgqlkyoxau)
-- Initiative: my-house (unit: house-schema-and-service)
--
-- Adds the "My House" feature's tables: a `rooms` lookup table, the `house_items`
-- catalog, `player_house_items` ownership, and `house_layout` placed-items-per-room.
-- Structural analogs: stickers -> house_items, player_stickers -> player_house_items,
-- creative_canvas -> house_layout (generalized with a `room` key).
-- IF NOT EXISTS / ON CONFLICT DO NOTHING make this idempotent. Forward-only.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rooms (
  id          text    PRIMARY KEY,
  label_vi    text    NOT NULL,
  label_en    text    NOT NULL,
  is_unlocked boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS house_items (
  id         text    PRIMARY KEY,
  room       text    NOT NULL REFERENCES rooms(id),
  name_vi    text    NOT NULL,
  name_en    text    NOT NULL,
  emoji      text    NOT NULL,
  price      integer NOT NULL CHECK (price > 0),
  is_active  boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS player_house_items (
  player_id    uuid        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id      text        NOT NULL REFERENCES house_items(id),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, item_id)
);

CREATE TABLE IF NOT EXISTS house_layout (
  player_id   uuid        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  room        text        NOT NULL REFERENCES rooms(id),
  layout_data jsonb       NOT NULL DEFAULT '[]'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, room)
);

-- ---------------------------------------------------------------------------
-- Seed data — idempotent via ON CONFLICT DO NOTHING (Q5=A: no admin surface,
-- catalog is fixed seed data edited via new SQL when needed).
-- ---------------------------------------------------------------------------

-- Rooms (4) — only bedroom is unlocked in V1 (Q8=A).
INSERT INTO rooms (id, label_vi, label_en, is_unlocked) VALUES
  ('bedroom',     'Phòng ngủ',  'Bedroom',     true),
  ('kitchen',     'Phòng bếp',  'Kitchen',     false),
  ('living_room', 'Phòng khách','Living Room', false),
  ('garden',      'Vườn',       'Garden',      false)
ON CONFLICT (id) DO NOTHING;

-- Bedroom catalog (6) — FR-1.5 / Q3=A.
INSERT INTO house_items (id, room, name_vi, name_en, emoji, price, is_active, sort_order) VALUES
  ('bed',        'bedroom', 'Giường',    'Bed',        '🛏️', 100, true, 10),
  ('desk',       'bedroom', 'Bàn học',   'Desk',       '🪑', 70,  true, 20),
  ('lamp',       'bedroom', 'Đèn ngủ',   'Lamp',       '💡', 40,  true, 30),
  ('teddy_bear', 'bedroom', 'Gấu bông',  'Teddy Bear', '🧸', 30,  true, 40),
  ('plant',      'bedroom', 'Cây cảnh',  'Plant',      '🪴', 50,  true, 50),
  ('rug',        'bedroom', 'Thảm',      'Rug',        '🟫', 60,  true, 60)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Matches the catalog query's exact filter shape: WHERE room = ? AND is_active = true
-- ORDER BY sort_order (tech-stack-decisions.md).
CREATE INDEX IF NOT EXISTS idx_house_items_room_active
  ON house_items(room, is_active);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE rooms               ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_house_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_layout        ENABLE ROW LEVEL SECURITY;

-- rooms: any authenticated user can read the room list (read-only lookup)
DROP POLICY IF EXISTS "rooms_select_authenticated" ON rooms;
CREATE POLICY "rooms_select_authenticated" ON rooms
  FOR SELECT USING (auth.role() = 'authenticated');

-- house_items: any authenticated user can read the catalog (read-only catalog)
DROP POLICY IF EXISTS "house_items_select_authenticated" ON house_items;
CREATE POLICY "house_items_select_authenticated" ON house_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- player_house_items: players can read and insert their own rows (no update/delete)
DROP POLICY IF EXISTS "player_house_items_select_own" ON player_house_items;
CREATE POLICY "player_house_items_select_own" ON player_house_items
  FOR SELECT USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "player_house_items_insert_own" ON player_house_items;
CREATE POLICY "player_house_items_insert_own" ON player_house_items
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- house_layout: players can read, insert, and update their own layout rows
DROP POLICY IF EXISTS "house_layout_select_own" ON house_layout;
CREATE POLICY "house_layout_select_own" ON house_layout
  FOR SELECT USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "house_layout_insert_own" ON house_layout;
CREATE POLICY "house_layout_insert_own" ON house_layout
  FOR INSERT WITH CHECK (auth.uid() = player_id);

DROP POLICY IF EXISTS "house_layout_update_own" ON house_layout;
CREATE POLICY "house_layout_update_own" ON house_layout
  FOR UPDATE USING (auth.uid() = player_id);

-- ---------------------------------------------------------------------------
-- purchase_house_item(player_id, item_id, price) — atomic purchase (BR-3, BR-8,
-- SECURITY-11).
--
-- Runs the affordability guard + ownership-idempotent-insert in ONE transaction,
-- with `SELECT ... FOR UPDATE` locking the player's row for the duration — this
-- serializes concurrent purchase attempts for the same player (no double-charge
-- race), and a failed guard simply rolls back the transaction (no compensating
-- delete is ever needed, since nothing was written on that path).
--
-- SECURITY DEFINER is required because `player_house_items`'s RLS policies only
-- grant SELECT/INSERT to `authenticated` (no UPDATE/DELETE) — a plain RLS-scoped
-- client can never safely undo an insert it just made. The function re-checks
-- `auth.uid() = p_player_id` itself (a SECURITY DEFINER function bypasses RLS, so
-- it MUST NOT trust the caller-supplied player_id without this check) before
-- touching any row, so the elevated privilege is never usable to affect another
-- player's balance or ownership.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION purchase_house_item(
  p_player_id uuid,
  p_item_id   text,
  p_price     integer
)
RETURNS TABLE (new_coin_balance integer, newly_purchased boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coins integer;
  v_owned boolean;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_player_id THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT coins INTO v_coins FROM players WHERE id = p_player_id FOR UPDATE;
  IF v_coins IS NULL THEN
    RAISE EXCEPTION 'player not found: %', p_player_id;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM player_house_items
    WHERE player_id = p_player_id AND item_id = p_item_id
  ) INTO v_owned;

  -- BR-8: already owned -> no-op success, no additional deduction.
  IF v_owned THEN
    RETURN QUERY SELECT v_coins, false;
    RETURN;
  END IF;

  -- BR-3: SQL-level affordability guard, fails closed (transaction rolls back,
  -- nothing written) if insufficient.
  IF v_coins < p_price THEN
    RAISE EXCEPTION 'insufficient_funds';
  END IF;

  UPDATE players SET coins = coins - p_price WHERE id = p_player_id;
  INSERT INTO player_house_items (player_id, item_id) VALUES (p_player_id, p_item_id);

  RETURN QUERY SELECT v_coins - p_price, true;
END;
$$;

GRANT EXECUTE ON FUNCTION purchase_house_item(uuid, text, integer) TO authenticated;
