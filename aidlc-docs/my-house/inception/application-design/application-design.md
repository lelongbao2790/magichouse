# Application Design — my-house

**Status**: Awaiting user approval
**Last updated**: 2026-09-13

This document consolidates `components.md`, `component-methods.md`, `services.md`, and
`component-dependency.md`. See those files for full detail; this is the summary + the design
decisions that drove them.

---

## 1. Scope

Application Design for the **My House** feature: a new dashboard section where children buy
Bedroom furniture with existing coins and decorate a canvas — modeled directly on the existing
Sticker Shop -> Creative Room loop. Full functional requirements are in
`inception/requirements/requirements.md`; this stage adds the **structural** decisions
(file/folder layout, service split, API shape, data-fetching pattern, room-nav abstraction) on
top of those already-locked behavioral decisions.

---

## 2. Design Decisions (from `application-design-plan.md`)

| # | Question | Decision |
|---|---|---|
| 1 | Component file structure | **B** — `components/my-house/` folder: `index.tsx` orchestrator + `room-nav.tsx`, `item-catalog.tsx`, `my-items-strip.tsx`, `bedroom-canvas.tsx` |
| 2 | Service layer structure | **A** — two services: `lib/services/house-items.ts` + `lib/services/house-layout.ts` |
| 3 | API route paths | **A** — flat, mirrors existing naming: `/api/house-items`, `/api/players/house-items`, `/api/players/house-layout` |
| 4 | Client data-fetching pattern | **B** — dedicated `useHouseItems()` hook with module-level caching |
| 5 | Room-navigation implementation | **B** — extract a reusable `<RoomNav>` component now |

**Consistency check**: Q1=B (a `room-nav.tsx` sub-component already anticipated) and Q5=B
(extracting `RoomNav` as a real reusable component rather than hardcoding tabs) are mutually
reinforcing — no contradiction. Q4=B departs from the closest analog's inline-fetch style but is
an independent, self-consistent choice (a cache-backed hook) that doesn't conflict with any other
answer. No ambiguous, vague, or combined-option answers were given; no follow-up questions were
required.

---

## 3. Components (see `components.md`)

- **`MyHouse`** (`components/my-house/index.tsx`) — orchestrator; owns `activeRoom`,
  `placedItems`, selection state; composes the four children below.
- **`RoomNav`** — reusable room tab list; active/locked rendering; presentational only.
- **`ItemCatalog`** — catalog grid for the active room; purchase UI; uses `useHouseItems()` +
  `coin-context`.
- **`MyItemsStrip`** — owned-but-unplaced items as drag sources.
- **`BedroomCanvas`** — drop target + placed-item renderer/repositioner (generalized to "room",
  not hardcoded "Bedroom", so a future room can reuse it unchanged).
- **`useHouseItems`** hook (`lib/hooks/use-house-items.ts`) — cached catalog fetch per room.
- **Extended**: `coin-context.tsx` (`ownedHouseItems`, `buyHouseItem()`, `hasHouseItem()`);
  `dashboard.tsx` (4th card, new `ViewType` branch).

## 4. Services (see `services.md`)

- **`lib/services/house-items.ts`** — `getCatalog()`, `getOwnedHouseItems()`,
  `purchaseHouseItem()`. Structural analog of `stickers.ts`, including the SQL-level
  affordability guard and idempotent ownership upsert.
- **`lib/services/house-layout.ts`** — `getLayout()`, `saveLayout()`, parameterized by `room`
  (unlike `canvas.ts`, since `house_layout` is keyed by `(player_id, room)`). Structural analog
  of `canvas.ts`.

## 5. Component Dependencies (see `component-dependency.md`)

Strictly layered, no circular dependencies: UI components -> hooks/context -> API routes ->
services -> Supabase tables. `MyHouse` is the sole state owner among the new components; its
four children are either purely presentational or read-only hook/context consumers.

---

## 6. Open Structural Question Deferred to Units Generation / Functional Design

- Exact `room` enum representation (Postgres `CHECK` constraint vs. a proper `room` lookup
  table) — a data-modeling detail, not a structural application-design concern; confirmed at
  Functional Design for the schema-owning unit (per the Key Risks note in `requirements.md` §13).
  **Resolved 2026-09-13**: a `rooms` lookup table (U1's Functional Design Q1=B), with a
  follow-up decision that `RoomNav` switches from a hardcoded client-side room list to fetching
  from a new `GET /api/rooms` route via a new `useRooms()` hook — see Amendments below.

## Amendments (post-approval)

| Date | Change | Reason | Affected artifacts |
|---|---|---|---|
| 2026-09-13 | Item names localized server-side, not via client `nameMap` | Corrects a mismatch against `requirements.md` FR-2.1, caught before any code existed | `components.md`, `component-methods.md`, `services.md` |
| 2026-09-13 | Added `rooms` lookup table, `getRooms()`, `GET /api/rooms`, `useRooms()` hook; `MyHouse`/`RoomNav` now DB-driven instead of hardcoded | Follow-up decision from U1's Functional Design (room representation), explicitly chosen by the user over the lower-impact alternative | `components.md`, `component-methods.md`, `services.md`, `component-dependency.md`, `unit-of-work.md`, `unit-of-work-dependency.md`, `unit-of-work-story-map.md` |

---

## 7. Traceability to Requirements

| Requirement | Addressed By |
|---|---|
| FR-1 (DB schema) | `lib/services/house-items.ts`, `lib/services/house-layout.ts` (consume tables; schema itself is Functional Design/Code Generation for the DB-owning unit) |
| FR-2 (API) | `app/api/house-items`, `app/api/players/house-items`, `app/api/players/house-layout` routes |
| FR-3 (UI) | `MyHouse`, `RoomNav`, `ItemCatalog`, `MyItemsStrip`, `BedroomCanvas` |
| FR-4 (client state) | `coin-context.tsx` extension |
| NFR-1 (compatibility) | No existing component/service/route is modified except the two additive extensions (`coin-context.tsx`, `dashboard.tsx`) |
