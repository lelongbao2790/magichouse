# Frontend Components — U2: my-house-ui

**Status**: Draft (Functional Design)
**Last updated**: 2026-09-14

Deepens Application Design's `components.md`/`component-methods.md` with full prop/state
definitions, interaction flows, and API integration points. Component *responsibilities*
(already decided) aren't repeated here except where needed for context.

---

## Component Hierarchy

```
MyHouse
+-- RoomNav
+-- ItemCatalog
+-- MyItemsStrip
+-- BedroomCanvas
```

Flat — no component nests another from this set; `MyHouse` composes all four as siblings.

---

## `MyHouse` (`components/my-house/index.tsx`)

**State owned**:
| State | Type | Initial value |
|---|---|---|
| `activeRoom` | `string` | `"bedroom"` |
| `placedItems` | `PlacedItem[]` | `[]` (until layout loads) |
| `layoutLoaded` | `boolean` | `false` (gates the autosave effect, per BR-7/Workflow 3-6 — mirrors `canvasLoaded` in `creative-room.tsx`, preventing a save-of-empty-array race before the real layout has loaded) |
| `selectedPlacementId` | `string \| null` | `null` |

**Derived** (not stored, computed each render):
- `unplacedOwnedItems: HouseItem[]` — `ownedHouseItems` (from `coin-context`) minus the
  `itemId`s present in `placedItems`, joined against the active room's catalog
  (`useHouseItems(activeRoom, language)`).
- `rooms: RoomTab[]` — from `useRooms(language)`, or `[]` on failure (BR-1).

**Effects**:
1. On mount and on `activeRoom` change: load the layout for `activeRoom` via
   `GET /api/players/house-layout?room=`; set `placedItems` and `layoutLoaded = true` on
   success or failure alike (empty array on failure, matching `getCanvas`'s no-rows handling
   and Q2a=A).
2. On any `placedItems` change **after** `layoutLoaded` becomes `true`: debounce 300ms, then
   `PUT /api/players/house-layout` with `{ room: activeRoom, layoutData: placedItems }`
   (BR-7).

**User interaction flows handled here**: none directly — `MyHouse` wires callbacks down to
children (`handleSelectRoom`, `handlePlaceItem`, `handleRepositionItem`, `handleRemoveItem`,
`handleSelectPlacedItem`) and receives their results back as state updates, per
`component-methods.md`.

**API integration points**: `GET/PUT /api/players/house-layout` (direct `fetch`, not via a
hook — matches `canvas.ts`'s usage pattern in `creative-room.tsx`, no caching needed since a
layout is loaded once per room-switch, not repeatedly).

---

## `RoomNav` (`components/my-house/room-nav.tsx`)

**Props**: `rooms: RoomTab[]`, `activeRoom: string`, `onSelectRoom: (roomId: string) => void`.
**State**: none (fully controlled by props).

**Interaction flow**: tapping an unlocked tab calls `onSelectRoom(room.id)`; tapping a locked
tab does nothing (BR-6 — no handler wired at all for locked tabs, not a disabled handler).

**API integration points**: none — receives `rooms` as props from `MyHouse` (which itself
sources them from `useRooms()`).

---

## `ItemCatalog` (`components/my-house/item-catalog.tsx`)

**Props**: `room: string`.
**State**: `buyingItemId: string | null` (BR-4's double-submit guard).

**Interaction flow**: tapping a **Buyable** item's Buy control sets `buyingItemId`, calls
`buyHouseItem(item)`, clears `buyingItemId` on settle (success or failure) — Workflow 2.

**API integration points**: `useHouseItems(room, language)` (read); `coin-context.buyHouseItem`
which internally calls `POST /api/players/house-items` (write) — `ItemCatalog` itself makes no
direct `fetch` call.

**Form validation**: N/A — no form inputs, only a single-action Buy control per item; the
"can this be clicked" logic is BR-4's three-state derivation, not field-level validation.

---

## `MyItemsStrip` (`components/my-house/my-items-strip.tsx`)

**Props**: `items: HouseItem[]` (i.e. `unplacedOwnedItems`, computed by `MyHouse`),
`onItemDropped: (itemId: string, clientX: number, clientY: number) => void`.
**State**: none (fully controlled by props; drag state lives transiently in the drag library's
own gesture state, not in component state — matches `creative-room.tsx`'s
`draggingSticker` being the only piece of drag-related component state, and even that is for a
visual "drop here" hint, not logic).

**Interaction flow**: drag-start on a chip begins a `DragSession`; drag-end reports the release
client coordinates via `onItemDropped` regardless of where they landed — bounds-checking
(BR-5) happens in `MyHouse`/`BedroomCanvas`, not here, since `MyItemsStrip` has no reference to
the canvas's bounding rect.

**API integration points**: none.

---

## `BedroomCanvas` (`components/my-house/bedroom-canvas.tsx`)

**Props** (corrected 2026-09-14 during Code Generation — see note below):
`placedItems: PlacedItemView[]`, `selectedItemId: string | null`,
`onReposition: (placedId: string, x: number, y: number) => void`,
`onSelect: (placedId: string | null) => void`, `onRemove: (placedId: string) => void`.
`ref` (forwarded, not a prop): the canvas DOM node.
**State**: none (the canvas ref is forwarded from `MyHouse`, not owned here).

**Correction (2026-09-14, Code Generation)**: no `onPlace` prop. The component hierarchy is
flat siblings — `MyItemsStrip`'s drop coordinates can never pass through `BedroomCanvas` to
reach it. `MyHouse` itself handles `MyItemsStrip.onItemDropped` via the shared, forwarded
`canvasRef`, calling its own placement logic directly; `BedroomCanvas` never receives or calls
`onPlace`. This document already hedged on this exact point ("passed up some other way per the
actual drag library's API") — the actual mechanism is a forwarded ref, not a callback prop.
Also: `placedItems` is typed `PlacedItemView[]` (a `PlacedHouseItem` enriched with `emoji`,
resolved by `MyHouse` against the active room's catalog, since `PlacedHouseItem` itself carries
only `itemId`) rather than the bare `PlacedItem[]` this doc originally specified.

**Interaction flow**:
1. Renders each `placedItems` entry at its `x`/`y` (BR-2 — no ownership cross-check).
2. Tapping a placed item calls `onSelect(id)` (toggle — tapping the already-selected one calls
   `onSelect(null)`); tapping empty canvas space calls `onSelect(null)`.
3. Dragging a placed item, on drag end, computes the clamped new position (BR-5) and calls
   `onReposition`.
4. The selected item shows a remove control only (BR-3) which calls `onRemove(id)`.
5. Exposes its bounding rect (via `canvasRef`, read by `MyHouse` or passed up some other way
   per the actual drag library's API) so `MyHouse` can determine whether a `MyItemsStrip` drop
   landed inside it, triggering `onPlace` (BR-5's bounds check, Workflow 3 step 2).

**API integration points**: none — all persistence happens in `MyHouse`.

---

## Cross-Cutting: State Ownership Summary

| State | Owned by | Read by |
|---|---|---|
| `activeRoom` | `MyHouse` | `RoomNav`, `ItemCatalog` |
| `placedItems` | `MyHouse` | `BedroomCanvas`, (derived) `MyHouse` itself for `unplacedOwnedItems` |
| `selectedPlacementId` | `MyHouse` | `BedroomCanvas` |
| `coins`, `ownedHouseItems` | `coin-context` (global) | `ItemCatalog`, `MyHouse` |
| `rooms` (via `useRooms`) | `MyHouse` (through the hook) | `RoomNav` |
| catalog (via `useHouseItems`) | Called independently by both `MyHouse` (to compute `unplacedOwnedItems`) and `ItemCatalog` (to render the grid) | Both — cheap because `useHouseItems` is module-cached per `(room, locale)` (Application Design Q4=B), so the second call is a cache hit, not a second network request |

No state is duplicated across components — each piece of mutable state has exactly one owner,
matching the "MyHouse as sole orchestrator" principle already established in Application
Design's `component-dependency.md`.
