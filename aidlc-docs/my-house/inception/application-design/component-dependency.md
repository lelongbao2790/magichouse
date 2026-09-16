# Component Dependency — my-house

**Status**: Draft (Application Design)
**Last updated**: 2026-09-13

---

## Dependency Matrix

| Component / Module | Depends On | Communication Pattern |
|---|---|---|
| `dashboard.tsx` (extended) | `MyHouse` | Direct render, same `ViewType` switch as Shop/Creative/Learning |
| `MyHouse` (index.tsx) | `RoomNav`, `ItemCatalog`, `MyItemsStrip`, `BedroomCanvas`, `useCoins()`, `useLanguage()`, `useAuth()`, `useHouseItems()`, `useRooms()`, `house-layout` API | Props down, callbacks up; direct `fetch` to `/api/players/house-layout` for load/debounced save |
| `RoomNav` | (none — presentational) | Props only: `rooms`, `activeRoom`, `onSelectRoom` |
| `ItemCatalog` | `useHouseItems()`, `useCoins()` (`buyHouseItem`, `hasHouseItem`, `coins`) | Hook calls; no direct API calls of its own |
| `MyItemsStrip` | (none — presentational, receives `items` as props) | Props only, emits `onItemDropped` |
| `BedroomCanvas` | (none — presentational, receives `placedItems` as props) | Props only, emits `onPlace`/`onReposition`/`onSelect`/`onRemove` |
| `useHouseItems` hook | `/api/house-items` route | `fetch`, module-level cache keyed by `(room, locale)` |
| `useRooms` hook (added 2026-09-13) | `/api/rooms` route | `fetch`, module-level cache keyed by `locale` |
| `coin-context.tsx` (extended) | `/api/players/house-items` route | `fetch`, optimistic local state update + localStorage cache |
| `app/api/house-items/route.ts` | `lib/services/house-items.ts::getCatalog` | Direct function call |
| `app/api/players/house-items/route.ts` | `lib/services/house-items.ts::getOwnedHouseItems`, `::purchaseHouseItem` | Direct function call |
| `app/api/players/house-layout/route.ts` | `lib/services/house-layout.ts::getLayout`, `::saveLayout` | Direct function call |
| `app/api/rooms/route.ts` (added 2026-09-13) | `lib/services/house-items.ts::getRooms` | Direct function call |
| `lib/services/house-items.ts` | Supabase tables: `house_items`, `player_house_items`, `players`, `rooms` (added 2026-09-13) | Supabase client queries |
| `lib/services/house-layout.ts` | Supabase table: `house_layout` | Supabase client queries |

**No circular dependencies**: data flows strictly downward (API routes -> services -> Supabase)
and state flows strictly through `MyHouse` as the single orchestrator for its children — no
sibling component (`RoomNav`/`ItemCatalog`/`MyItemsStrip`/`BedroomCanvas`) depends on another
sibling directly.

---

## Component Composition

```
+--------------------------------------------------------------------+
|                           dashboard.tsx                            |
|                   (4th card -> ViewType "house")                   |
+--------------------------------------------------------------------+
                                   |
                                   v
+--------------------------------------------------------------------+
|                 MyHouse (index.tsx, orchestrator)                  |
|        state: activeRoom, placedItems, selectedPlacedItemId        |
+--------------------------------------------------------------------+
        |                 |                 |                 |
        v                 v                 v                 v
+--------------+  +--------------+  +--------------+  +--------------+
|   RoomNav    |  | ItemCatalog  |  | MyItemsStrip |  |BedroomCanvas |
+--------------+  +--------------+  +--------------+  +--------------+
```

---

## Data Flow — Flow A: Catalog display

```
+-------------+
| ItemCatalog |
+-------------+
       |
       v
+-----------------+
| useHouseItems() |
+-----------------+
         |
         v
+----------------------+
| GET /api/house-items |
+----------------------+
            |
            v
+----------------+
| house-items.ts |
|  getCatalog()  |
+----------------+
         |
         v
+-------------------+
| house_items table |
+-------------------+
```

## Data Flow — Flow B: Purchase

```
+--------------------------+
| ItemCatalog: handleBuy() |
+--------------------------+
              |
              v
+------------------------------+
| coin-context: buyHouseItem() |
+------------------------------+
                |
                v
+-------------------------------+
| POST /api/players/house-items |
+-------------------------------+
                |
                v
+---------------------+
|   house-items.ts    |
| purchaseHouseItem() |
+---------------------+
           |
           v
+-------------------------------+
|    players.coins (guarded)    |
| + player_house_items (upsert) |
+-------------------------------+
```

## Data Flow — Flow C: Ownership load on player login

```
+-----------------------------------+
| coin-context (player-load effect) |
+-----------------------------------+
                  |
                  v
+------------------------------+
| GET /api/players/house-items |
+------------------------------+
                |
                v
+----------------------+
|    house-items.ts    |
| getOwnedHouseItems() |
+----------------------+
            |
            v
+--------------------------+
| player_house_items table |
+--------------------------+
```

## Data Flow — Flow D: Layout load/save

```
+---------------------+
| MyHouse (index.tsx) |
+---------------------+
           |
           v
+-----------------------------------+
| GET/PUT /api/players/house-layout |
+-----------------------------------+
                  |
                  v
+----------------------------+
|      house-layout.ts       |
| getLayout() / saveLayout() |
+----------------------------+
               |
               v
+--------------------+
| house_layout table |
+--------------------+
```

## Data Flow — Flow E: Room list (added 2026-09-13, Functional Design U1 clarification)

```
+-----------------------+
| RoomNav (via MyHouse) |
+-----------------------+
            |
            v
+------------+
| useRooms() |
+------------+
       |
       v
+----------------+
| GET /api/rooms |
+----------------+
         |
         v
+----------------+
| house-items.ts |
|   getRooms()   |
+----------------+
         |
         v
+-------------+
| rooms table |
+-------------+
```

### Text Alternative (always included per content-validation.md)

```
Flow 1 — Catalog display:
  ItemCatalog -> useHouseItems() -> GET /api/house-items -> house-items.ts:getCatalog()
  -> house_items table

Flow 2 — Purchase:
  ItemCatalog -> coin-context.buyHouseItem() -> POST /api/players/house-items
  -> house-items.ts:purchaseHouseItem() -> players.coins (guarded update)
  + player_house_items (idempotent insert)

Flow 3 — Ownership load (on player login):
  coin-context (player-load effect) -> GET /api/players/house-items
  -> house-items.ts:getOwnedHouseItems() -> player_house_items table

Flow 4 — Layout load/save:
  MyHouse -> GET/PUT /api/players/house-layout -> house-layout.ts:getLayout()/saveLayout()
  -> house_layout table

Flow 5 — Room list (added 2026-09-13):
  RoomNav (via MyHouse) -> useRooms() -> GET /api/rooms -> house-items.ts:getRooms()
  -> rooms table
```
