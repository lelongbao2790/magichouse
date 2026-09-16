# Business Logic Model — U1: house-schema-and-service

**Status**: Draft (Functional Design)
**Last updated**: 2026-09-13

Technology-agnostic workflows. Cross-references `business-rules.md` (BR-#) for the concrete
validation/error rules each step enforces.

---

## Workflow 1 — Get Room List

**Trigger**: `GET /api/rooms?locale=`
**Actors**: Authenticated player (any)

1. Authenticate the caller; reject `401` if not authenticated.
2. Validate `locale` (BR-9); reject `400` if invalid.
3. Read all rows from `Room`.
4. For each row, select `label` from `labelVi`/`labelEn` per `locale`; map `isUnlocked` to the
   response's `locked = !isUnlocked` (BR-2).
5. Return the 4 rooms.

## Workflow 2 — Get Catalog

**Trigger**: `GET /api/house-items?room=&locale=`
**Actors**: Authenticated player (any)

1. Authenticate the caller; reject `401` if not authenticated.
2. Default `room` to `bedroom` if omitted; validate `room` against the known 4 values — reject
   `400` if present but invalid (BR-1).
3. Validate `locale` (BR-9); reject `400` if invalid.
4. Read active (`isActive = true`) `HouseItem` rows for `room`, ordered by `sortOrder`.
5. For each row, select `name` from `nameVi`/`nameEn` per `locale`.
6. Return the localized catalog.

## Workflow 3 — Get Owned Items

**Trigger**: `GET /api/players/house-items`
**Actors**: Authenticated player (self only)

1. Authenticate the caller; reject `401` if not authenticated.
2. Read all `PlayerHouseItem.itemId` values for the caller.
3. Return the list of owned item IDs.

## Workflow 4 — Purchase Item

**Trigger**: `POST /api/players/house-items { itemId }`
**Actors**: Authenticated player (self only)

1. Authenticate the caller; reject `401` if not authenticated.
2. Validate the request body (`itemId` present, string); reject `400` if malformed.
3. Look up the item's `price` and `isActive` by `itemId`; reject `404`/`400` if the item
   doesn't exist or isn't active (mirrors the existing sticker-purchase route's item lookup).
4. Attempt the SQL-level affordability guard: decrement the caller's `coins` by `price`, only if
   `coins >= price` (BR-3).
   - **If the guard affects zero rows** (insufficient funds): raise the shared
     `InsufficientFundsError`; no ownership change; the route returns `400`.
   - **If the guard succeeds**: proceed to step 5.
5. Idempotently record ownership: insert `(playerId, itemId)` into `PlayerHouseItem`, doing
   nothing if the pair already exists (BR-8).
6. Return the new coin balance.

## Workflow 5 — Get Layout

**Trigger**: `GET /api/players/house-layout?room=`
**Actors**: Authenticated player (self only)

1. Authenticate the caller; reject `401` if not authenticated.
2. Validate `room` (required, one of the 4 known values); reject `400` if missing/invalid.
3. Read the `HouseLayout` row for `(playerId, room)`. If none exists yet, return an empty
   `layoutData` array (first-time player — no error, matches `getCanvas`'s no-rows handling).
4. Return `layoutData`.

## Workflow 6 — Save Layout

**Trigger**: `PUT /api/players/house-layout { room, layoutData }`
**Actors**: Authenticated player (self only)

1. Authenticate the caller; reject `401` if not authenticated.
2. Validate `room` (BR-1) and the shape/bounds of every `layoutData` entry (BR-7); reject `400`
   on any failure, before touching the database.
3. Validate the array length against the room's active catalog count (BR-6); reject `400` if
   exceeded.
4. Validate that every `itemId` referenced in `layoutData` is owned by the caller (BR-4); if any
   is not, reject `400` and **write nothing**.
5. Duplicate `itemId`s within the payload are allowed through — no check (BR-5).
6. Upsert the `(playerId, room)` `HouseLayout` row with the new `layoutData` and current
   timestamp — full replacement of the room's layout, not a merge (matches `saveCanvas`'s
   single-row-upsert semantics).
7. Return success (no body needed, matches the existing `PUT /api/players/canvas` contract).

---

## Cross-Cutting Notes

- **Steps 2-4 of Workflow 6 are ordered validation-before-database-access**: shape/bounds first
  (cheapest, no DB round-trip), then the count bound (cheap, no DB round-trip once the room's
  catalog count is known — which itself may be cached or queried once), then ownership (one DB
  round-trip). This ordering rejects malformed requests as cheaply as possible before spending a
  query on ownership validation.
- **Every workflow above except Workflow 1 already existed conceptually in `requirements.md`**
  (FR-2.1 through FR-2.4) — Workflow 1 is the one addition from this Functional Design pass
  (per the room-list clarification), and BR-4/BR-5/BR-6 are the concrete rules this pass added
  on top of FR-2.5's general "validate shape/count/bounds" statement.
