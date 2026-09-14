# Functional Design Plan — U1: house-schema-and-service

**Status**: Answered, clarification resolved (B — new `GET /api/rooms` + `useRooms()`,
amendments applied), generating Functional Design artifacts
**Last updated**: 2026-09-13

---

## Purpose

Detailed, technology-agnostic business logic for U1: the `house_items` /
`player_house_items` / `house_layout` domain model, the purchase workflow, the layout
persistence workflow, and the validation/error rules around both. Most of this is already
locked by `requirements.md` and mirrors the `stickers`/`canvas` analogs closely — this plan
resolves the remaining genuine business-rule decisions (flagged as open in `unit-of-work.md`
and elsewhere) before generating `business-logic-model.md`, `business-rules.md`, and
`domain-entities.md`.

---

## Design Questions

Please fill in each `[Answer]:` tag and say "done".

---

### Question 1 — `room` representation (deferred here per Units Generation Q5=A)

Only `bedroom` has real catalog rows in V1; `kitchen`/`living_room`/`garden` are locked and
have no rows at all yet. Room metadata (label, emoji, lock state) already lives client-side in
`RoomNav`'s `RoomTab` data (per `components.md`) — the DB only needs to validate that `room` is
one of the 4 known values.

A) **Postgres `CHECK` constraint**: `room text NOT NULL CHECK (room IN ('bedroom', 'kitchen',
   'living_room', 'garden'))` on both `house_items` and `house_layout`. Simplest option;
   matches the fact that no room-level metadata needs to live in the DB. *(Recommended)*

B) **A `rooms` lookup table** (`id`, `label_vi`, `label_en`, `is_unlocked`) with a foreign key
   from `house_items`/`house_layout` — future-proofs for server-driven room metadata, at the
   cost of an extra table + join for something not needed yet.

C) Other (describe after [Answer]: tag)

[Answer]:B

---

### Question 2 — Server-side ownership validation on `saveLayout`

`requirements.md` NFR-3 states a placed item's `itemId` must always refer to an item the player
owns, and this is a PBT-covered invariant (PBT-F touches layout round-trip; the ownership part
of NFR-3 isn't explicitly a PBT target but is a stated data-integrity requirement). The client
only ever sends owned items today, but the server currently has no stated behavior for a
layout payload that references an unowned `itemId` (e.g. stale client state, or a
directly-crafted request).

A) **Reject the whole request** — `saveLayout`/the `PUT` route checks every `itemId` in the
   payload against `player_house_items` for that player; if any is unowned, return `400` and
   save nothing. *(Recommended — fails closed, matches SECURITY-15/NFR-3 exactly, and is a
   single extra query against an already-fetched-per-request table)*

B) **Silently filter out** unowned items from the payload before saving — save whatever's left,
   no error.

C) **Trust the client, no server-side ownership check** — rely entirely on the client never
   sending an unowned `itemId` (matches `creative_canvas`'s current behavior, which has no such
   check either since stickers can't be "unowned" once bought).

D) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 3 — Duplicate placement of the same item within one layout

Per requirements.md Assumption A-1, V1 doesn't support placing the same owned item more than
once (no "quantity" concept). Today nothing described stops a layout payload from listing the
same `itemId` twice.

A) **No server-side restriction** — this is a UI convention (the client's drag source removes
   an item from "My Items" once placed, so it naturally can't be dragged twice), not a
   data-integrity rule; the server accepts whatever shape passes the other validations.
   *(Recommended — matches Assumption A-1's own framing as a UX choice, not an invariant, and
   avoids inventing a new server-side rule not requested anywhere)*

B) **Reject a layout with a duplicate `itemId`** — `400` if the same item appears twice in one
   `layoutData` array.

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 4 — Layout item count bound

FR-2.5 requires validating layout "item shape/count/position bounds" but doesn't state the
count bound itself.

A) **Cap at the total number of Bedroom catalog items (6 in V1, grows with the catalog)** — a
   layout can never have more placed items than exist to own, so this is really "at most one
   entry per catalog item" enforced as a count ceiling rather than a fixed magic number.
   *(Recommended — ties the bound to actual data instead of a hardcoded constant that would
   need updating if the catalog grows)*

B) **A fixed hardcoded cap** (e.g. 50) — describe your preferred number after [Answer]: tag.

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 5 — `InsufficientFundsError` — reuse or duplicate?

`lib/services/stickers.ts` already exports `InsufficientFundsError`. `house-items.ts` needs the
same error for `purchaseHouseItem`.

A) **Import and reuse** `InsufficientFundsError` from `lib/services/stickers.ts` — one error
   type for "not enough coins" across the whole app, since the route-level handling
   (`err instanceof InsufficientFundsError` → `400`) is identical either way. *(Recommended —
   avoids a needless duplicate class for an identical concept)*

B) **Define a new, separate `InsufficientFundsError`** in `house-items.ts` — keeps each service
   module fully self-contained with no cross-service import, even at the cost of a duplicate
   class.

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 6 — Invalid (not just omitted) `room` value on `GET /api/house-items`

FR-2.1 states an *omitted* `room` defaults to `bedroom`. It doesn't state what happens for a
`room` value that's present but not one of the 4 valid values (e.g. `?room=garage`).

A) **`400` invalid room** — validated by the same Zod room-enum schema used everywhere else
   (`house-layout`'s `PUT`/`GET` already do this per TC-A036). Consistent validation behavior
   across every route that takes a `room` param. *(Recommended)*

B) **Silently fall back to `bedroom`** for any unrecognized value, same as the omitted case.

C) Other (describe after [Answer]: tag)

[Answer]:A

---

## Categories Evaluated But Not Turned Into Questions (with justification)

- **Concurrent-tab layout save races**: Two tabs saving `house_layout` for the same
  `(player_id, room)` concurrently would last-write-wins overwrite each other — identical,
  pre-existing behavior to `creative_canvas`'s `saveCanvas` (no locking/versioning there
  either). Not asking a new question here since this feature isn't introducing a new risk
  beyond what the codebase already accepts for the exact same shape of data.
- **Integration Points**: None beyond Supabase (already covered by every service/route
  signature in `services.md`) — no external system integration for U1.
- **Frontend Components**: N/A for U1 (backend-only unit; covered under U2's Functional Design).
