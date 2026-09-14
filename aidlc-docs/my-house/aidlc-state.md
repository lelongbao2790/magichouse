# AI-DLC State Tracking

## Project Information
- **Initiative Slug**: my-house
- **Project Type**: Brownfield
- **Start Date**: 2026-09-11T00:00:00Z
- **Current Stage**: COMPLETE — all AI-DLC phases finished 2026-09-14 (Operations = placeholder; release runbook in operations/operations.md)

## Workspace State
- **Existing Code**: Yes
- **Reverse Engineering Needed**: Yes (general architecture/tech-stack/business-overview carried forward
  from `aidlc-docs/subject-content-db/inception/reverse-engineering/` — unchanged since 2026-09-09;
  a new focused `my-house-findings.md` was generated covering the Decoration/Creative Room/Sticker Shop
  subsystem this feature will reuse)
- **Workspace Root**: /Users/brian/Github_Repo/magichouse-dev/magichouse

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/my-house/)
- **Documentation**: aidlc-docs/my-house/ only
- **Structure patterns**: See code-generation.md Critical Rules

## Execution Plan Summary
- **Stages to Execute**: Test Case Design, Application Design, Units Generation, Functional
  Design (x2 units), NFR Requirements (x2 units), NFR Design (U1 only), Code Generation,
  Build and Test
- **Stages to Skip**: User Stories, Infrastructure Design
- **Units of Work**: 2 (U1 house-schema-and-service -> U2 my-house-ui)

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes — full/blocking | Requirements Analysis (Q10=A) |
| Resiliency Baseline | Yes — directional best practices | Requirements Analysis (Q11=A) |
| Property-Based Testing | Yes — FULL / blocking | Requirements Analysis (Q12=A) |

## Requirements Decisions So Far (pre-requirements.md)
- Navigation: 4th dashboard card (Q1=A)
- Item visuals: emoji only (Q2=A)
- V1 catalog: Bed 100 / Desk 70 / Lamp 40 / Teddy Bear 30 / Plant 50 / Rug 60, exact (Q3=A)
- Schema: multi-room-ready now via `room` column (Q4=A)
- Admin: none — fixed seed catalog (Q5=A)
- Client state: extend `coin-context.tsx` (Q6=A)
- i18n: localize item names EN/VI (Q7=A)
- Locked rooms: simple grayed-out card (Q8=A)
- Test scope: Unit + API + E2E (Q9=C)

## Source Requirement
- User pointed to `features-requirement/magic_house_feature_requirements/01-my-magic-house.md`
  (and its condensed duplicate `01-v1-my-house.md`) and asked to implement it.

## What this initiative is
Add **My House** as a new main-dashboard section: children spend their existing coin balance to
buy Bedroom furniture/decorations and drag-and-drop them onto a Bedroom canvas, mirroring the
existing Sticker Shop -> Creative Room loop. V1 = Bedroom only; Kitchen/Living Room/Garden shown
as locked/coming-later.

## Stage Progress

### INCEPTION PHASE
- [x] Workspace Detection — Completed 2026-09-11
- [x] Reverse Engineering — Completed 2026-09-11 (carried forward + refreshed; implicitly approved —
      no changes requested across two rounds of clarification)
- [x] Requirements Analysis — Approved by user 2026-09-11
- [ ] User Stories — SKIP (Workflow Planning)
- [x] Workflow Planning — Approved by user 2026-09-11
- [x] Test Case Design — Approved by user 2026-09-11 — TC-E018-027, TC-A031-037, PBT-D/E/F/G, TC-M006-008
- [x] Application Design — Approved by user 2026-09-13 (post-approval correction applied same day)
- [x] Units Generation — Approved by user 2026-09-13

### CONSTRUCTION PHASE (U1 and U2 built in parallel per Units Generation Q2=B — not strictly
sequential; U2 uses stub types until reconciliation)
- [x] U1 house-schema-and-service — Functional Design / NFR Requirements / NFR Design all approved
- [x] U2 my-house-ui — Functional Design / NFR Requirements approved (NFR Design SKIPPED, references U1's RESILIENCY-14 answer)
- [x] Code Generation Part 1 (Planning) — plans approved for both units
- [x] Code Generation Part 2 — U1 COMPLETE (one user-approved deviation: purchaseHouseItem's
      guard uses a SECURITY DEFINER RPC function instead of the literal stickers.ts-mirroring
      pattern, fixing a genuine race condition — see business-rules.md BR-3's amendment note
      and audit.md)
- [x] Code Generation Part 2 — U2 COMPLETE (independently verified: 225/225 tests, 0 lint
      errors, 0 new tsc errors, reviewer PASS; 3 minor design-doc corrections, no architecture
      deviations — see frontend-components.md and audit.md), awaiting user approval
- [x] Infrastructure Design — SKIP (no new infrastructure)
- [x] Build and Test — Approved by user 2026-09-14

### OPERATIONS PHASE
- [x] Operations — PLACEHOLDER; release runbook written to `operations/operations.md`

## Current Status
- **Lifecycle Phase**: COMPLETE
- **Current Stage**: COMPLETE — all AI-DLC phases finished 2026-09-14
- **Next Stage**: None. Release runbook is in `operations/operations.md` for whenever the
  branch is actually merged/deployed.

## Build and Test Results
- Build: success (`npm run build`), 4 new routes registered
- Tests: 225/225 passing (full suite), including this initiative's 54 tests (50 unit/API + 4 PBT)
- Lint: 0 errors, 17 pre-existing-pattern warnings
- Typecheck: 0 new errors
- Security: no blocking finding (full/blocking extension re-verified)
- E2E: not run in this sandboxed environment (no dev server/DB) — compiles/lints clean,
  deferred to post-deploy per precedent
- Manual checklist: TC-M006-008 appended, pending deploy
- CI: `.github/workflows/ci.yml` INITIATIVE var updated to `my-house`
- Artifacts: `aidlc-docs/my-house/construction/build-and-test/*.md`
- **Design pipeline status**: Both units' full design is complete and approved.
- **Known deviations (both resolved, documented, no unapproved architecture remaining)**:
  1. U1: `purchaseHouseItem` uses a `SECURITY DEFINER` Postgres RPC function instead of the
     originally-approved two-query pattern mirroring `stickers.ts` — fixes a genuine race
     condition. User-approved. See `functional-design/business-rules.md` BR-3 (U1).
  2. U2: 3 minor `frontend-components.md` corrections (no `onPlace` prop on `BedroomCanvas`;
     `PlacedItemView` type; test file location) — doc-detail gaps, not architecture changes.
     See `functional-design/frontend-components.md` (U2).

## Functional Design (U2) Decisions
- useRooms() total failure: silent-empty, not hardcoded fallback (Q1=A)
- Placed-item rendering: no ownership cross-check (Q2=A)
- Resize controls: omitted for V1 (Q3=B)
- Artifacts: `aidlc-docs/my-house/construction/my-house-ui/functional-design/
  {domain-entities,business-rules,business-logic-model,frontend-components}.md`

## NFR Design (U1) Decision
- RESILIENCY-14 (Resiliency Testing Approach): B — no existing practice, AI-DLC proposed a
  lightweight DR test plan (restore drill, RLS policy check, purchase-guard chaos check)
- Artifacts: `aidlc-docs/my-house/construction/house-schema-and-service/nfr-design/
  {nfr-design-patterns,logical-components}.md`

## Functional Design (U1) — Decisions & Amendments
- Room representation: `rooms` lookup table, not CHECK constraint (Q1=B)
- Follow-up: `RoomNav` now DB-driven via new `GET /api/rooms` + `useRooms()` hook, not
  hardcoded (clarification=B) — Application Design + Units Generation artifacts amended in
  place (see audit.md)
- saveLayout ownership validation: reject whole request if any itemId unowned (Q2=A)
- No server-side duplicate-placement check (Q3=A)
- Layout count bound: raw length <= room's active catalog count (Q4=A)
- InsufficientFundsError: reused from stickers.ts, not duplicated (Q5=A)
- Invalid room on catalog GET: 400 (Q6=A)
- Artifacts: `aidlc-docs/my-house/construction/house-schema-and-service/functional-design/
  {domain-entities,business-rules,business-logic-model}.md`

## Units Generation Decisions
- Keep 2-unit split: U1 house-schema-and-service, U2 my-house-ui (Q1=A)
- Build order: parallel against stub types, reconciled before Build and Test (Q2=B)
- Shared-file ownership: database.types.ts/validation-api.ts = U1 only;
  translations.ts/coin-context.tsx/dashboard.tsx = U2 only (Q3=A)
- Deployment: U1+U2 ship together in one release (Q4=A)
- room enum representation: decided in U1 Functional Design, not here (Q5=A)
- Artifacts: `aidlc-docs/my-house/inception/application-design/{unit-of-work,
  unit-of-work-dependency,unit-of-work-story-map}.md`

## Application Design Decisions
- Component structure: `components/my-house/` folder — `index.tsx` orchestrator +
  `room-nav.tsx`, `item-catalog.tsx`, `my-items-strip.tsx`, `bedroom-canvas.tsx` (Q1=B)
- Service layer: two services, `lib/services/house-items.ts` + `lib/services/house-layout.ts` (Q2=A)
- API routes: flat, mirrors existing naming (`/api/house-items`, `/api/players/house-items`,
  `/api/players/house-layout`) (Q3=A)
- Client data-fetching: dedicated `useHouseItems()` hook with module-level caching (Q4=B)
- Room navigation: reusable `<RoomNav>` component extracted now, not hardcoded (Q5=B)
- Artifacts: `aidlc-docs/my-house/inception/application-design/{components,component-methods,
  services,component-dependency,application-design}.md`
- **Post-approval correction (2026-09-13)**: item-name localization fixed from client-side
  `nameMap` to server-side (per FR-2.1) — see audit.md. `useHouseItems(room, locale)`,
  `getCatalog(supabase, room, locale)` updated; `ItemCatalog.getItemName()` removed.

## Units Generation — Plan Issued (awaiting answers)
- `inception/plans/unit-of-work-plan.md` created: proposed 2-unit split (U1
  house-schema-and-service -> U2 my-house-ui), 5 planning questions (split confirmation, build
  order, shared-file ownership, deployment sequencing, room-enum decision point).

## Test Scope
- **Selection**: Unit + API + E2E (Q9=C)
- **Test Case Design file**: aidlc-docs/my-house/inception/test-cases/test-case-design.md
- **TC-E count**: 10 (TC-E018–TC-E027)
- **TC-A count**: 7 (TC-A031–TC-A037)
- **PBT groups**: 4 (PBT-D/E/F/G, blocking)
- **TC-M count**: 3 (TC-M006–TC-M008) → MANUAL-TEST-CHECKLIST.md
- **E2E browsers**: Chromium only
