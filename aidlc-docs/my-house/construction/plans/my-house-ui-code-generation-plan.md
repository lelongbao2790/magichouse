# Code Generation Plan — U2: my-house-ui

**Status**: Awaiting user approval
**Last updated**: 2026-09-14

---

## Unit Context

- **Stories/requirements implemented**: FR-3 (UI), FR-4 (client state), NFR-3/NFR-6 (U2's
  share) — per `unit-of-work-story-map.md`.
- **Dependencies**: U1 (contract-level only — per Units Generation Q2=B, this unit is coded
  against U1's design artifacts and, initially, hand-written stub types; since U1 is being
  generated in this same session, U2 codes directly against U1's real generated types/routes
  instead of temporary stubs — the "reconciliation" step is therefore a no-op here).
- **Database entities used (not owned)**: `rooms`, `house_items`, `player_house_items`,
  `house_layout` (read/written only via U1's API routes, never directly).
- **Design source documents**: `construction/my-house-ui/functional-design/*.md`,
  `construction/my-house-ui/nfr-requirements/*.md`,
  `inception/application-design/{components,component-methods}.md`.

## Workspace

- **Workspace root**: `/Users/brian/Github_Repo/magichouse-dev/magichouse` (brownfield).

---

## Steps

- [x] **Step 1 — Data-Fetching Hooks**: Create `lib/hooks/use-house-items.ts`
  (`useHouseItems(room, locale)`) and `lib/hooks/use-rooms.ts` (`useRooms(locale)`), both with
  module-level caching, per `component-methods.md`.

- [x] **Step 2 — Client State Extension**: Extend `contexts/coin-context.tsx` with
  `ownedHouseItems`, `buyHouseItem()`, `hasHouseItem()` — loaded in the existing player-load
  effect alongside `coins`/`ownedStickers`, same optimistic-update + localStorage-cache
  pattern as stickers (per FR-4.1, `business-logic-model.md` Workflow 2).

- [x] **Step 3 — Frontend Components**: Create `components/my-house/room-nav.tsx`,
  `item-catalog.tsx`, `my-items-strip.tsx`, `bedroom-canvas.tsx`, and `index.tsx` (the `MyHouse`
  orchestrator) — per `frontend-components.md`'s full prop/state/interaction spec. Add every
  `data-testid` from `test-case-design.md`'s "data-testid Attribute Requirements" table
  (`nav-house`, `my-house`, `room-bedroom`/`room-kitchen`/`room-living-room`/`room-garden`,
  `house-items-grid`, `house-item-{itemId}`, `buy-house-{itemId}`, `my-items-house`,
  `my-item-{itemId}`, `bedroom-canvas`, `placed-house-{itemId}`, `remove-house-{itemId}`,
  `no-house-items-message`).

- [x] **Step 4 — Dashboard Integration**: Extend `components/dashboard.tsx` — add `"house"` to
  `ViewType`, a 4th `mainSections` entry with `data-testid="nav-house"`, and the conditional
  render branch mounting `<MyHouse onBack={...} />` (mirrors the shop/creative/learning
  branches exactly).

- [x] **Step 5 — Translations**: Extend `data/translations.ts` with UI-chrome keys only (room
  labels/emoji if not server-driven for display purposes, "Coming soon", buy button text,
  empty-state message) — no item-name keys (server-localized per U1).

- [x] **Step 6 — Frontend Unit Tests**: Add a layout-position-clamping unit test (matches
  `test-case-design.md`'s "Unit / Helper Tests" table row) alongside U1's tests, and confirm the
  `house_layout` DTO round-trip test (shared coverage with U1's Step 5).

- [x] **Step 7 — Property-Based Tests (U2's share)**: Extend
  `automation_tests/unit/house-items.pbt.test.ts` (created in U1's Step 8) with PBT-E
  (placement position bounds) and PBT-F (layout round-trip), using the `placedItemArb`
  generator, per `test-case-design.md`.

- [x] **Step 8 — E2E Test Spec**: Create `automation_tests/e2e/my-house.spec.ts` with all 10
  TC-E cases (TC-E018–TC-E027), titled exactly per `test-case-design.md`, using the
  `topUpCoins(page, amount)` helper and the `data-testid`s from Step 3.

- [x] **Step 9 — Manual Test Checklist**: Add TC-M006, TC-M007, TC-M008 to
  `MANUAL-TEST-CHECKLIST.md` at the workspace root (append — do not remove prior initiatives'
  entries).

- [ ] **Step 10 — Documentation**: Write a brief code summary to
  `aidlc-docs/my-house/construction/my-house-ui/code/summary.md`. (Skipped by the
  Code Generation agent per an explicit system-level restriction on writing
  report/summary docs — reported via the agent's final text response instead; the
  orchestrating session should write this file from that report.)

---

## Story Traceability

| Step | Requirement(s) | Test case(s) |
|---|---|---|
| 1, 3 | FR-3.2, FR-3.3 | TC-E018–TC-E021 |
| 2 | FR-4.1 | TC-E020, TC-E026 |
| 3 | FR-3.2–FR-3.6 | TC-E018–TC-E025 |
| 4 | FR-3.1 | TC-E018, TC-E027 |
| 5 | NFR-4 | — |
| 6, 7 | NFR-6 | PBT-E, PBT-F |
| 8 | AC-1–AC-6 | TC-E018–TC-E027 |
| 9 | — | TC-M006–TC-M008 |
| 10 | — | — |
