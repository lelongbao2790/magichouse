# Unit of Work — my-house

**Status**: Approved (user, 2026-09-13)
**Last updated**: 2026-09-13

Decomposition per the approved `inception/plans/unit-of-work-plan.md` (Q1=A: keep the 2-unit
split as previewed in Application Design / Execution Plan).

---

## U1 — house-schema-and-service

**Responsibility**: The data model, server-side business logic (including the server-side
locale selection required by FR-2.1), and the HTTP contract that U2's UI is built against.

**Owns**:
- DB migration: `house_items`, `player_house_items`, `house_layout` tables + RLS policies +
  idempotent seed insert (6 Bedroom items); **added 2026-09-13**: `rooms` lookup table
  (`id`, `label_vi`, `label_en`, `is_unlocked`), with `house_items.room`/`house_layout.room` as
  FKs to it (see Functional Design decision below).
- `lib/services/house-items.ts` — `getCatalog(supabase, room, locale)`,
  `getOwnedHouseItems(supabase, userId)`, `purchaseHouseItem(supabase, userId, itemId, price)`,
  and (**added 2026-09-13**) `getRooms(supabase, locale)`.
- `lib/services/house-layout.ts` — `getLayout(supabase, userId, room)`,
  `saveLayout(supabase, userId, room, layoutData)`.
- API routes: `app/api/house-items/route.ts` (GET), `app/api/players/house-items/route.ts`
  (GET, POST), `app/api/players/house-layout/route.ts` (GET, PUT), and (**added 2026-09-13**)
  `app/api/rooms/route.ts` (GET).
- `lib/database.types.ts` additions: `HouseItemRow`, `PlayerHouseItemRow`, `HouseLayoutRow`,
  `PlacedHouseItem`, and (**added 2026-09-13**) `RoomRow` (per Q3=A — U1's additive edit to
  this shared file).
- `lib/validation/api.ts` additions: Zod schemas for all new routes (room enum, item
  existence, layout item shape/bounds — per FR-2.5).

**Resolved structural decision (U1 Functional Design)**: the `room` column's representation is
a **`rooms` lookup table** (Q1=B, not the recommended `CHECK` constraint), which in turn raised
a follow-up: the client's room list — originally hardcoded per Application Design — now comes
from this table via a new `GET /api/rooms` route and `useRooms()` hook (clarification Q=B). See
`application-design.md`'s Amendments section for the full change record.

**Test ownership** (from `test-case-design.md`): TC-A031–TC-A037 (all 7 API cases), the
`purchaseHouseItem`/layout-DTO/name-resolution unit tests, PBT-D (purchase affordability) and
PBT-G (idempotent ownership), and TC-M008 (migration verification).

---

## U2 — my-house-ui

**Responsibility**: The player-facing screen — browse, buy, place, persist — built against U1's
API contract (per Q2=B, initially against hand-written stub types, reconciled once U1 is real).

**Owns**:
- `components/my-house/` — `index.tsx` (`MyHouse` orchestrator, now also fetching the room list
  via `useRooms()` — added 2026-09-13), `room-nav.tsx` (`RoomNav`, unchanged — still
  presentational, still just receives `RoomTab[]` as props), `item-catalog.tsx` (`ItemCatalog`),
  `my-items-strip.tsx` (`MyItemsStrip`), `bedroom-canvas.tsx` (`BedroomCanvas`).
- `lib/hooks/use-house-items.ts` — `useHouseItems(room, locale)`, and (**added 2026-09-13**)
  `lib/hooks/use-rooms.ts` — `useRooms(locale)`.
- `contexts/coin-context.tsx` extension — `ownedHouseItems`, `buyHouseItem()`,
  `hasHouseItem()` (per Q3=A — U2's additive edit to this shared file).
- `components/dashboard.tsx` extension — 4th `mainSections` card + `"house"` `ViewType` branch
  (per Q3=A — U2's additive edit to this shared file).
- `data/translations.ts` additions — UI-chrome keys only (room labels, "Coming soon", buy
  button text, empty-state message); item names are **not** translation keys (server-localized
  per U1, corrected in Application Design's post-approval fix).

**Test ownership**: TC-E018–TC-E027 (all 10 E2E cases), the layout-position-clamping unit test,
`house_layout` DTO round-trip (shared with U1's layout service test where applicable), PBT-E
(placement bounds) and PBT-F (layout round-trip), and TC-M006/TC-M007 (content review, mobile
drag feel).

---

## Build Order & Coordination (per Q2=B, Q3=A, Q4=A)

- **Build order**: U1 and U2 are built **in parallel**. U2 starts immediately against
  hand-written TypeScript types matching U1's planned response shapes (mirroring
  `HouseItemRow`/`PlacedHouseItem` as already sketched in `component-methods.md`/`services.md`);
  reconciliation against U1's real types/routes happens once both are code-complete, before
  Build and Test.
- **Shared-file discipline**: `lib/database.types.ts` and `lib/validation/api.ts` receive only
  U1's additive edits; `data/translations.ts` and `contexts/coin-context.tsx` receive only U2's
  additive edits; `components/dashboard.tsx` is U2-only. No file is edited by both units.
- **Deployment**: U1 and U2 ship together in one release (migration applied + API + UI all at
  once) — no intentional staged rollout.

## Code Organization

Brownfield — no new top-level directory strategy needed. New files land in the existing
structure exactly as listed above (`components/my-house/`, `lib/services/`, `lib/hooks/`,
`app/api/house-items/`, `app/api/players/house-items/`, `app/api/players/house-layout/`,
`supabase/migrations/`), matching the conventions `stickers`/`canvas`/`sticker-shop`/
`creative-room` already establish.
