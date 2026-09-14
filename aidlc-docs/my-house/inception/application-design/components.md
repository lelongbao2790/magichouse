# Components — my-house

**Status**: Draft (Application Design)
**Last updated**: 2026-09-13

Per approved design answers: Q1=B (multi-file `components/my-house/` folder), Q4=B (dedicated
`useHouseItems()` hook), Q5=B (reusable `<RoomNav>` extracted now).

---

## Client Components (`components/my-house/`)

### 1. `MyHouse` — `components/my-house/index.tsx`
**Purpose**: Orchestrator for the whole My House screen. Rendered by `Dashboard` when
`currentView === "house"`, replacing the dashboard full-screen (same convention as `StickerShop`
/ `CreativeRoom`).

**Responsibilities**:
- Owns the screen-level header (back button, `<CoinDisplay />`, language/theme switchers) —
  identical layout to the sibling screens.
- Owns cross-cutting state that multiple children need: `activeRoom`, the loaded Bedroom
  `placedItems` layout, and which placed item (if any) is currently selected.
- Fetches/saves the Bedroom layout (via `lib/services/house-layout.ts` through the
  `/api/players/house-layout` route) and derives "owned but not yet placed" items by diffing
  `ownedHouseItems` (from `coin-context`) against `placedItems`.
- **Amendment (2026-09-13, Functional Design U1 clarification)**: sources the room list from
  `useRooms()` (DB-backed, per the `rooms` lookup table decided in U1's Functional Design)
  instead of a hardcoded array — passes the fetched `RoomTab[]` straight through to `RoomNav`
  unchanged in shape.
- Composes `RoomNav`, `ItemCatalog`, `MyItemsStrip`, and `BedroomCanvas`, passing each the slice
  of state/callbacks it needs.

**Interfaces**: No props (top-level view); consumes `useCoins()`, `useLanguage()`, `useAuth()`,
`useHouseItems()`, and `useRooms()`.

---

### 2. `RoomNav` — `components/my-house/room-nav.tsx`
**Purpose**: Reusable room-switcher, generalized now per Q5=B instead of hardcoding 4 tabs.

**Responsibilities**:
- Renders a row of room tabs/cards from a data-driven list (id, label, emoji, `locked` flag).
- Active room is highlighted; locked rooms render grayed-out with a lock icon and "Coming soon"
  label and are non-interactive (no click handler wired).
- Purely presentational + selection — holds no data-fetching or business logic itself. This
  holds even after the amendment above: `RoomNav` still only receives `RoomTab[]` as props; it
  has no idea whether that list was hardcoded or fetched — only `MyHouse`'s data source changed.

**Interfaces**: `rooms: RoomTab[]`, `activeRoom: string`, `onSelectRoom: (roomId: string) => void`.

---

### 3. `ItemCatalog` — `components/my-house/item-catalog.tsx`
**Purpose**: Displays the purchasable catalog for the active room (analog of `StickerShop`'s
grid, minus the category tabs — My House has no sub-categories within a room for V1).

**Responsibilities**:
- Renders each catalog item's emoji, localized name, price, owned/affordability state, and a Buy
  control (disabled + "need N more coins" when unaffordable, matching `sticker-shop.tsx`).
- Delegates the purchase action to `coin-context`'s `buyHouseItem()`; shows a per-item
  buying/purchase-animation state while the request is in flight.
- Sources catalog data from `useHouseItems()` (loading state included) rather than fetching
  directly. **Correction (2026-09-13)**: per requirements FR-2.1, item names are localized
  **server-side** (the API returns an already-localized `name`, selected from `name_vi`/
  `name_en` per the caller's locale) — matching the `subject-content-db` precedent
  (`GET /api/subjects/[key]/questions?locale=`), not the older Sticker Shop client-side
  `nameMap` pattern. `ItemCatalog` therefore renders `item.name` directly; no client-side name
  lookup function is needed.

**Interfaces**: `room: string` (which room's catalog to show).

---

### 4. `MyItemsStrip` — `components/my-house/my-items-strip.tsx`
**Purpose**: Shows owned-but-not-yet-placed items as drag sources onto the Bedroom canvas
(analog of Creative Room's "Sticker Collection" panel).

**Responsibilities**:
- Renders draggable chips for each unplaced owned item (emoji + localized name).
- Emits drag-start/drag-end so `BedroomCanvas` can compute the drop position; does not itself
  know about canvas coordinates.
- Shows an empty state ("nothing to place yet — buy something!") when there are no unplaced
  owned items.

**Interfaces**: `items: HouseItemRow[]` (unplaced owned items, computed by `MyHouse`),
`onItemDropped: (itemId: string, clientX: number, clientY: number) => void`.

---

### 5. `BedroomCanvas` — `components/my-house/bedroom-canvas.tsx`
**Purpose**: The drop target + placed-item renderer for the active room (analog of
`creative-room.tsx`'s canvas area, generalized to "room" instead of hardcoded "Bedroom" so a
future room can reuse it unchanged).

**Responsibilities**:
- Renders the room background and all currently placed items at their `x`/`y` percentage
  coordinates (Framer Motion `drag`, same clamp-to-[5,95] mechanic as Creative Room).
- Lets a placed item be repositioned by dragging it within the canvas.
- Shows remove controls on the selected placed item; removing returns the item to "unplaced"
  (still owned) rather than deleting ownership.
- Reports layout changes upward so `MyHouse` can debounce-save them — this component does not
  call the save API itself, keeping data access in the orchestrator/service layer.

**Interfaces**: `placedItems: PlacedHouseItem[]`, `selectedItemId: string | null`,
`onPlace: (itemId: string, x: number, y: number) => void`,
`onReposition: (placedId: string, x: number, y: number) => void`,
`onSelect: (placedId: string | null) => void`, `onRemove: (placedId: string) => void`.

---

## Client Hook

### `useHouseItems` — `lib/hooks/use-house-items.ts`
**Purpose**: Dedicated data-fetching hook for the house-items catalog, with module-level caching
(Q4=B) — the same shape as the existing `useSubjectQuestions` pattern, applied here instead of
the plainer inline-`useEffect` style `sticker-shop.tsx` uses.

**Responsibilities**:
- Fetches `GET /api/house-items?room=&locale=` once per `(room, locale)` pair and caches the
  result at module scope, keyed by that pair — so switching rooms (once more rooms exist) or
  remounting `ItemCatalog` doesn't refetch needlessly within a session, and a language switch
  correctly busts the cache and refetches with the new locale.
- Exposes `{ catalog, loading, error }` for the given `(room, locale)`; catalog items already
  carry a server-localized `name` field (per FR-2.1) — no client-side name lookup needed.

### `useRooms` — `lib/hooks/use-rooms.ts`
**Added 2026-09-13** (Functional Design U1 clarification — see `unit-of-work.md` amendment
note). Analogous to `useHouseItems`, one level simpler (no room/locale parameter — it fetches
the whole room list once).

**Purpose**: Dedicated data-fetching hook for the `rooms` table, replacing what would otherwise
be a hardcoded room list in `MyHouse`.

**Responsibilities**:
- Fetches `GET /api/rooms` once and caches the result at module scope (same caching approach as
  `useHouseItems`, since the room list changes even less often than the item catalog).
- Exposes `{ rooms: RoomTab[], loading, error }`, already shaped to pass directly into
  `RoomNav`'s `rooms` prop (server `is_unlocked` maps to `RoomTab.locked = !is_unlocked`; label
  fields are locale-selected the same way `getCatalog` selects item names).

---

## Extended Existing Component/Context (not new, modified)

### `coin-context.tsx` (extended, per Q6=A in requirements)
- New state: `ownedHouseItems: string[]`.
- New methods: `buyHouseItem(item: HouseItemRow): Promise<boolean>`,
  `hasHouseItem(itemId: string): boolean`.
- Loaded alongside `coins`/`ownedStickers` in the existing player-load effect; same
  optimistic-update + localStorage-cache pattern as stickers.

### `dashboard.tsx` (extended)
- `ViewType` gains `"house"`; `mainSections` gains a 4th entry ("My House" card); a new
  conditional render branch mounts `<MyHouse onBack={...} />` (mirrors the existing
  shop/creative/learning branches exactly).

---

## Server-Side Components (Services)

See `services.md` for `lib/services/house-items.ts` and `lib/services/house-layout.ts` (Q2=A —
two services, mirroring the exact split of the analog feature).
