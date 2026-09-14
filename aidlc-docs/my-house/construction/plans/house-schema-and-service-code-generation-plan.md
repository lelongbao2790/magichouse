# Code Generation Plan — U1: house-schema-and-service

**Status**: Awaiting user approval
**Last updated**: 2026-09-14

---

## Unit Context

- **Stories/requirements implemented**: FR-1 (schema), FR-2 (API), NFR-3/NFR-6 (data
  integrity/PBT — U1's share), NFR-8 (deployment) — per `unit-of-work-story-map.md`.
- **Dependencies**: None (U1 is the foundation unit).
- **Interfaces/contracts produced**: 5 API routes (`GET /api/house-items`,
  `GET/POST /api/players/house-items`, `GET/PUT /api/players/house-layout`,
  `GET /api/rooms`) and the type shapes U2 codes against (initially via U2's own stub types,
  per the parallel-build decision — reconciled once this unit is generated).
- **Database entities owned**: `rooms`, `house_items`, `player_house_items`, `house_layout`.
- **Design source documents**: `construction/house-schema-and-service/functional-design/*.md`,
  `construction/house-schema-and-service/nfr-requirements/*.md`,
  `construction/house-schema-and-service/nfr-design/*.md`,
  `inception/application-design/services.md`.

## Workspace

- **Workspace root**: `/Users/brian/Github_Repo/magichouse-dev/magichouse` (brownfield —
  modify/extend existing structure, per `code-generation.md`'s Brownfield File Modification
  Rules).

---

## Steps

- [x] **Step 1 — Database Migration**: Create
  `supabase/migrations/0004_house_items_schema.sql` (next sequential number after `0002`,
  `0003`): `rooms` table (seeded with the 4 rooms, `bedroom.is_unlocked = true`, others
  `false`), `house_items` table (FK to `rooms`, seeded with the 6 Bedroom items per FR-1.5),
  `player_house_items` table (composite PK, FKs to `players`/`house_items`),
  `house_layout` table (composite PK, FK to `players`), RLS policies matching
  `stickers`/`player_stickers`/`creative_canvas`'s exact pattern (catalog/rooms: `SELECT`-only
  for `authenticated`; ownership/layout: `auth.uid() = player_id` scoped), and the
  `idx_house_items_room_active` composite index (per U1's `tech-stack-decisions.md`). Idempotent
  (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING` for seed inserts), forward-only (no
  down migration), matching `0001`/`0002`/`0003`'s conventions exactly.

- [x] **Step 2 — Type Definitions**: Extend `lib/database.types.ts` with `rooms`,
  `house_items`, `player_house_items`, `house_layout` table types and the named aliases
  (`RoomRow`, `HouseItemRow`, `PlayerHouseItemRow`, `HouseLayoutRow`) plus the `PlacedHouseItem`
  interface (mirrors `CanvasItem`).

- [x] **Step 3 — Validation Schemas**: Extend `lib/validation/api.ts` with a room-enum Zod
  schema (reused across all routes that take `room`), `BuyHouseItemSchema`, and a
  `HouseLayoutSchema` (validates `room` + `layoutData` shape/bounds/count per U1's BR-6/BR-7).

- [x] **Step 4 — Business Logic (Services)**: Create `lib/services/house-items.ts`
  (`getCatalog`, `getOwnedHouseItems`, `purchaseHouseItem` — importing
  `InsufficientFundsError` from `lib/services/stickers.ts` per Q5=A; `getRooms`) and
  `lib/services/house-layout.ts` (`getLayout`, `saveLayout` — including the ownership
  cross-check per BR-4), per `business-logic-model.md`'s 6 workflows and `business-rules.md`'s
  BR-1 through BR-9.

- [x] **Step 5 — Business Logic Unit Tests**: Create `automation_tests/unit/house-items.test.ts`
  (or the project's existing unit test location convention) covering: `purchaseHouseItem`
  success/insufficient-funds/idempotent-repeat; `getRooms`/`getCatalog`'s locale-selection
  logic; `saveLayout`'s ownership-rejection (BR-4), count-bound (BR-6), and duplicate-allowed
  (BR-5) behaviors — per `test-case-design.md`'s "Unit / Helper Tests" table (as corrected).

- [x] **Step 6 — API Layer**: Create `app/api/house-items/route.ts` (GET),
  `app/api/players/house-items/route.ts` (GET, POST),
  `app/api/players/house-layout/route.ts` (GET, PUT), `app/api/rooms/route.ts` (GET) — each
  following the existing route pattern exactly (auth check, Zod parse, service call,
  `apiSuccess`/`apiError`).

- [x] **Step 7 — API Tests**: Create `automation_tests/api/house-items.api.test.ts` covering
  TC-A031 through TC-A037 (per `test-case-design.md`), plus a `rooms` route test (401
  unauthenticated case, matching the API Test Generation Rules' "every route gets coverage"
  requirement even though `rooms` predates numbered TC-A cases). Verify
  `vitest.config.ts`'s `include` glob already covers `automation_tests/api/` — no change
  expected (existing config already does, per `subject-content-db` precedent).

- [x] **Step 8 — Property-Based Tests (U1's share)**: Create/extend
  `automation_tests/unit/house-items.pbt.test.ts` with PBT-D (purchase affordability
  invariant) and PBT-G (idempotent ownership) using `fast-check`, per `test-case-design.md`.
  Define the `houseItemArb` generator alongside the project's existing `_arbitraries.ts`
  utility (PBT-07).

- [x] **Step 9 — Documentation**: Write a brief code summary to
  `aidlc-docs/my-house/construction/house-schema-and-service/code/summary.md` (markdown only,
  per Code Location Rules) noting created/modified files. **Completed by the orchestrating
  session directly** (not the coding subagent, whose Write tool hard-blocks creation of
  report/summary-style `.md` files as a system-level safety restriction).

---

## Deviation from Plan (logged, user-approved)

Step 4's `purchaseHouseItem` was implemented via a `SECURITY DEFINER` Postgres RPC function
rather than the plan's specified two-query pattern mirroring `stickers.ts`. This fixes a
genuine race condition present in the literal mirrored pattern. Discovered during review after
the code-generation agent stalled; surfaced to the user, who chose to keep it. Full record in
`audit.md` and `code/summary.md`.

---

## Story Traceability

| Step | Requirement(s) | Test case(s) |
|---|---|---|
| 1 | FR-1, NFR-8 | TC-M008 |
| 2, 3 | FR-2.5 | — |
| 4 | FR-2, BR-1–BR-9 | — |
| 5 | NFR-5 | (unit tests, unnumbered) |
| 6 | FR-2 | — |
| 7 | FR-2, AC-7 | TC-A031–TC-A037 |
| 8 | NFR-6, AC-4, AC-8 | PBT-D, PBT-G |
| 9 | — | — |
