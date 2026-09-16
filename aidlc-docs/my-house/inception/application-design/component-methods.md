# Component Methods — my-house

**Status**: Draft (Application Design)
**Last updated**: 2026-09-13

High-level method signatures only. Detailed business rules (validation edge cases, exact drag
math, error text) are deferred to Functional Design (per-unit, CONSTRUCTION phase).

---

## `MyHouse` (`components/my-house/index.tsx`)

| Method | Signature | Purpose |
|---|---|---|
| (component) | `MyHouse({ onBack }: { onBack: () => void })` | Top-level view; no other props |
| `handleSelectRoom` | `(roomId: string) => void` | Updates `activeRoom`; no-ops for locked rooms (guarded in `RoomNav` already, defensive here too) |
| `handlePlaceItem` | `(itemId: string, x: number, y: number) => void` | Appends a new placed item to local `placedItems` state, triggers debounced save |
| `handleRepositionItem` | `(placedId: string, x: number, y: number) => void` | Updates one placed item's coordinates in `placedItems`, triggers debounced save |
| `handleRemoveItem` | `(placedId: string) => void` | Removes item from `placedItems` (stays in `ownedHouseItems`, becomes "unplaced" again), triggers debounced save |
| `handleSelectPlacedItem` | `(placedId: string \| null) => void` | Tracks which placed item shows remove controls |
| (derived) | `unplacedOwnedItems: HouseItemRow[]` | `ownedHouseItems` (from `coin-context`) minus item IDs present in `placedItems`, joined against the active room's catalog from `useHouseItems()` |

**Amendment (2026-09-13)**: room list now comes from `useRooms()` (see below), not a hardcoded
array — `MyHouse` passes `rooms` straight through to `RoomNav` unchanged in shape.

---

## `RoomNav` (`components/my-house/room-nav.tsx`)

| Method | Signature | Purpose |
|---|---|---|
| (component) | `RoomNav({ rooms, activeRoom, onSelectRoom }: RoomNavProps)` | Renders room tabs |
| `RoomTab` (type) | `{ id: string; label: string; emoji: string; locked: boolean }` | Data shape per tab |

---

## `ItemCatalog` (`components/my-house/item-catalog.tsx`)

| Method | Signature | Purpose |
|---|---|---|
| (component) | `ItemCatalog({ room }: { room: string })` | Renders catalog grid for one room |
| `handleBuy` | `(item: HouseItemRow) => Promise<void>` | Calls `buyHouseItem(item)` from `coin-context`, manages per-item buying/animation state |

**Correction (2026-09-13)**: no `getItemName` method — per FR-2.1, the API returns an
already-localized `name` per the caller's locale (server-side, matching `subject-content-db`'s
`?locale=` precedent, not the Sticker Shop `nameMap` pattern). The component renders
`item.name` as-is.

---

## `MyItemsStrip` (`components/my-house/my-items-strip.tsx`)

| Method | Signature | Purpose |
|---|---|---|
| (component) | `MyItemsStrip({ items, onItemDropped }: MyItemsStripProps)` | Renders draggable unplaced-item chips |
| `handleDragEnd` | `(itemId: string, info: PanInfo, event: PointerEventLike) => void` | Computes drop client coordinates, calls `onItemDropped` if the drop landed inside the canvas bounds (bounds check itself lives in `BedroomCanvas`/`MyHouse`, per Functional Design) |

---

## `BedroomCanvas` (`components/my-house/bedroom-canvas.tsx`)

| Method | Signature | Purpose |
|---|---|---|
| (component) | `BedroomCanvas({ placedItems, selectedItemId, onPlace, onReposition, onSelect, onRemove }: BedroomCanvasProps)` | Renders canvas + placed items |
| `handlePlacedItemDragEnd` | `(placedId: string, info: PanInfo) => void` | Computes new clamped `x`/`y` from drag offset, calls `onReposition` |
| `handleCanvasClick` | `() => void` | Deselects the currently selected placed item |

---

## `useHouseItems` (`lib/hooks/use-house-items.ts`)

| Method | Signature | Purpose |
|---|---|---|
| (hook) | `useHouseItems(room: string, locale: Language): { catalog: HouseItemRow[]; loading: boolean; error: string \| null }` | Fetches + module-caches `GET /api/house-items?room=&locale=`, cache keyed by `(room, locale)` |

---

## `useRooms` (`lib/hooks/use-rooms.ts`) — added 2026-09-13

| Method | Signature | Purpose |
|---|---|---|
| (hook) | `useRooms(locale: Language): { rooms: RoomTab[]; loading: boolean; error: string \| null }` | Fetches + module-caches `GET /api/rooms`, cache keyed by `locale`; maps each DB row's `is_unlocked` to `RoomTab.locked = !is_unlocked` |

---

## `coin-context.tsx` (extended)

| Method | Signature | Purpose |
|---|---|---|
| `buyHouseItem` | `(item: HouseItemRow) => Promise<boolean>` | POSTs to `/api/players/house-items`, optimistically updates `coins`/`ownedHouseItems` on success (mirrors `buySticker`) |
| `hasHouseItem` | `(itemId: string) => boolean` | `ownedHouseItems.includes(itemId)` |

---

## Service Layer Methods

See `services.md` for full signatures of `lib/services/house-items.ts` and
`lib/services/house-layout.ts`.
