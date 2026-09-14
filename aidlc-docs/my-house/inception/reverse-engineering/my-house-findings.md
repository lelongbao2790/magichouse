# My House — Focused Findings

**Read this first.** This is the subsystem My House will closely mirror: the existing
**Sticker Shop -> Creative Room** buy/own/place/auto-save loop. General architecture, tech stack,
and business overview are carried forward unchanged in the sibling files in this folder.

## 1. The pattern to reuse

| Concern | Existing analog (Decoration) | My House needs |
|---|---|---|
| Catalog | `stickers` table (id, name, category, emoji, price) | New `house_items` table (id, name, room, price, + image/emoji) |
| Ownership | `player_stickers` (player_id, sticker_id) | New `player_house_items` (player_id, item_id) |
| Placed layout | `creative_canvas` (player_id PK, `canvas_data` jsonb array, updated_at) | New table for placed items per room, e.g. `bedroom_layout` (or a room-keyed table if designed for multi-room now) |
| Catalog fetch | `GET /api/stickers` -> `lib/services/stickers.ts getCatalog()` | `GET /api/house-items` (or similar) |
| Ownership fetch | `GET /api/players/stickers` | `GET /api/players/house-items` |
| Purchase | `POST /api/players/stickers { stickerId }` -> `purchaseSticker()` — reads `players.coins`, does `UPDATE ... WHERE id=$1 AND coins >= $2` (SQL-level insufficient-funds guard), then idempotent upsert into ownership table (`ON CONFLICT ... ignoreDuplicates`) | Same pattern against `house_items` |
| Layout fetch/save | `GET/PUT /api/players/canvas` -> `lib/services/canvas.ts` (`getCanvas`/`saveCanvas`, single-row upsert keyed by `player_id`, debounced 300ms client-side save) | Same pattern for Bedroom layout |
| Client state | `contexts/coin-context.tsx` (`CoinProvider`): loads `coins` + `ownedStickers` on player load, `buySticker()`, `hasSticker()`, `addCoins()`; also does one-time localStorage->DB migration | House ownership could live in a new context, or extend coin-context with `ownedHouseItems` — **needs a design decision** |
| Drag-and-drop | `components/creative-room.tsx`: Framer Motion `drag` prop; catalog items use `dragSnapToOrigin` + `onDragEnd` to compute drop position as a **percentage of canvas bounding rect** (`x/y` 0-100), clamped 5-95 on move; placed items are separately draggable (`drag`, `dragMomentum={false}`) with `onDragEnd` adjusting position by `info.offset`; selecting a placed item reveals resize/delete controls | Reuse this exact mechanic for placing furniture in the Bedroom |
| Navigation | `components/dashboard.tsx`: **card-based**, not a persistent tab bar — `mainSections` array (Shop/Creative/Learning) rendered as clickable cards; a local `ViewType` union + `currentView` state switches which full-screen component renders | Add `"house"` to `ViewType` + a 4th card; a *room* sub-navigation lives inside the new House component itself |
| RLS pattern | Every player-owned table: `ENABLE ROW LEVEL SECURITY` + `auth.uid() = player_id` policies for select/insert(/update); catalog tables are `auth.role() = 'authenticated'` select-only | Same for new tables |

## 2. Key files (read before designing/coding)

- `components/dashboard.tsx` — main nav (cards + `ViewType` switch), `mainSections` array
- `components/sticker-shop.tsx` — catalog browsing/purchase UI, category tabs, afford/owned states, loading state
- `components/creative-room.tsx` — canvas + drag-and-drop + debounced save/load, character switcher (not needed for House, but the canvas mechanic is)
- `contexts/coin-context.tsx` — coin balance + sticker ownership state, `buySticker()`, `addCoins()`
- `lib/services/stickers.ts` — `getCatalog`, `getOwnedStickers`, `purchaseSticker` (SQL-level affordability guard)
- `lib/services/canvas.ts` — `getCanvas`, `saveCanvas` (single-row-per-player upsert)
- `app/api/stickers/route.ts`, `app/api/players/stickers/route.ts`, `app/api/players/canvas/route.ts`
- `lib/database.types.ts` — `StickerRow`, `PlayerStickerRow`, `CanvasItem` type shapes to model new equivalents on
- `supabase/migrations/0001_initial_schema.sql` — schema + RLS + trigger patterns to follow for new tables
- `data/stickers.ts` — **note**: this is a *stale, unused* client-side catalog (stickers now come from the DB via `/api/stickers`); do not copy this pattern for House items — go straight to DB-backed like `subject-content-db` did

## 3. Differences from the source requirement doc to flag

- The requirement doc says "new main navigation tab" — the actual dashboard has **no tab bar**,
  it's a card grid with client-side view switching. My House should be added as a 4th card the
  same way Shop/Creative/Learning are, not as a literal `<nav>` tab. (Raised as a clarifying
  question rather than assumed.)
- FR-3 says each item displays an **Image**; the existing Sticker Shop uses emoji only (no real
  image assets), even though `stickers` conceptually could hold images. Real furniture "Image"
  assets don't exist in the repo — need to decide emoji vs. real images vs. simple CSS/SVG shapes
  (raised as a clarifying question).
- The requirement doc's example item list (Bed 100, Desk 70, Lamp 40, Teddy Bear 30, Plant 50,
  Rug 60) has no stated author/i18n split — existing sticker names are Vietnamese-only strings
  with a `nameMap` -> `t()` translation lookup in the component; the UI otherwise supports
  EN/VI via `language-context`. House items will need the same localized-name treatment.
- No admin CRUD requirement was stated for house items (unlike `subject-content-db`'s admin
  routes for quiz content) — items are described as a fixed V1 catalog. Confirming scope via
  clarifying questions rather than assuming a full CRUD surface is needed.
