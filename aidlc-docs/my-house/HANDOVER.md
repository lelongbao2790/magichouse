# Handover — my-house

**Last updated**: 2026-09-13T00:00:00Z

## Where things stand
INCEPTION PHASE is complete (Workspace Detection through Units Generation, all approved).
**All AI-DLC phases are complete.** INCEPTION, CONSTRUCTION, and OPERATIONS (a placeholder in
this setup — no deploy automation exists yet) are all done and approved. The initiative is
code-complete, sitting on a branch, not yet merged/deployed. The release runbook is
`operations/operations.md` — read it when the branch is actually ready to merge.

Build: ✅ success (4 new routes registered). Full test suite: ✅ 225/225 passing (this
initiative's 54 tests included: 50 unit/API + 4 PBT). Lint: ✅ 0 errors. Typecheck: ✅ 0 new
errors. Security (full/blocking extension): ✅ no blocking finding. E2E: ⏳ not run in this
sandboxed environment (no dev server/DB) — compiles/lints clean, deferred to post-deploy,
matching the `subject-content-db` precedent exactly. `MANUAL-TEST-CHECKLIST.md` gained
TC-M006–008. `.github/workflows/ci.yml`'s `INITIATIVE` var was updated to `my-house`.

All of this was run and verified directly in this session (not just trusted from a subagent's
report) — `npm install`, `npm run build`, `npm run lint`, `npm test`, `npm audit --omit=dev`.

The initiative is now **code-complete** — implemented, tested, and documented — but the branch
has not been merged, and nothing has been deployed. See `operations/operations.md` for the
release runbook when that's ready to happen.

**Two things worth knowing if you're picking this up fresh:**
1. **U1's `purchaseHouseItem`** uses a `SECURITY DEFINER` Postgres RPC function
   (`purchase_house_item`, with row locking) instead of the originally-approved two-query
   pattern mirroring `stickers.ts`. This was an unrequested deviation by the coding agent,
   discovered on review — but investigation confirmed the literal mirrored pattern has a
   genuine, pre-existing under-charge race condition (present in `stickers.ts` today too). The
   user was asked and chose to keep the RPC-based fix. Read `business-rules.md` BR-3's
   amendment note before touching `purchaseHouseItem` or the migration's function.
2. **U2's `BedroomCanvas`** does not have an `onPlace` prop as `frontend-components.md`
   originally specified — `MyHouse` handles placement itself via a forwarded canvas ref, since
   the component hierarchy is flat siblings and `onPlace` could never actually be called from
   inside `BedroomCanvas`. This and two smaller corrections are documented in
   `frontend-components.md` (U2) directly — no architecture impact, just doc-detail fixes.

Earlier: a non-default Functional Design answer (room list as a DB lookup table, not a `CHECK`
constraint) triggered a follow-up that reopened and amended the already-approved Application
Design + Units Generation artifacts (new `GET /api/rooms` route + `useRooms()` hook) — see
"Amendments" in `application-design.md` and the two "Post-Approval Correction"/"Amended"
entries in `audit.md`.

**Post-approval corrections** (both same-mistake, caught and fixed while starting Units
Generation): item-name localization was designed/described as a client-side `nameMap` lookup
(copied from Sticker Shop) in both the approved Application Design (`components.md`/
`component-methods.md`/`services.md`) and the approved Test Case Design
(`test-case-design.md`'s unit-test table) — `requirements.md` FR-2.1 actually requires
**server-side** locale selection, matching `subject-content-db`'s `?locale=` precedent. Both
fixed in place; no code existed yet to cascade into. See audit.md for both correction entries.

## What this initiative is
Add a new **My House** section where children spend their existing coin balance on Bedroom
furniture/decorations and drag-and-drop them onto a Bedroom canvas — the same
buy -> own -> place -> auto-save loop as the existing Sticker Shop -> Creative Room, applied to a
new "house item" catalog instead of character stickers. Source doc:
`features-requirement/magic_house_feature_requirements/01-my-magic-house.md`.

## Stage history
| Stage | Status | Notes |
|---|---|---|
| Workspace Detection | Completed | Brownfield; new initiative distinct from subject-content-db / grade2-subjects-coin-rewards |
| Reverse Engineering | Completed | General docs carried forward unchanged (2026-09-09 -> still current); new `my-house-findings.md`; implicitly approved |
| Requirements Analysis | Completed | 13 main Q's + 7 Resiliency-mandated Q's answered; `requirements.md` approved |
| Workflow Planning | Completed | `execution-plan.md` approved — 2 units (house-schema-and-service -> my-house-ui) |
| Test Case Design | Completed | TC-E018-027, TC-A031-037, PBT-D/E/F/G, TC-M006-008 approved |
| Application Design | Completed | Approved 2026-09-13 — 5 structural questions answered — Q1=B, Q2=A, Q3=A, Q4=B, Q5=B (see Key decisions below); `inception/application-design/*.md` |
| Units Generation | Completed | Approved 2026-09-13 — 2-unit split confirmed (U1/U2); build order = parallel w/ stub types (Q2=B, non-default); `inception/application-design/unit-of-work*.md` |
| U1 Functional Design | Completed | Approved 2026-09-13 — room list = DB lookup table (non-default), triggering an amendment to Application Design/Units Generation; `construction/house-schema-and-service/functional-design/*.md` |
| U1 NFR Requirements | Completed | Approved 2026-09-13 — no questions needed; Security re-verified vs new `rooms` table/route, no new blocking finding; `construction/house-schema-and-service/nfr-requirements/*.md` |
| U1 NFR Design | Completed | Approved 2026-09-14 — RESILIENCY-14=B (propose DR plan); 3-item test plan proposed; runs for U1 only per `execution-plan.md` |
| U2 Functional Design | Completed | Approved 2026-09-14 — Q1=A (silent-empty rooms fallback), Q2=A (no ownership cross-check), Q3=B (no resize); `construction/my-house-ui/functional-design/*.md` |
| U2 NFR Requirements | Completed | Approved 2026-09-14 — no questions; Usability gap noted (no keyboard drag alternative); Security re-verified; `construction/my-house-ui/nfr-requirements/*.md` |
| Code Generation (Planning) | Completed | Approved 2026-09-14 — U1 plan (9 steps) + U2 plan (10 steps); both in `construction/plans/` |
| Code Generation — U1 | Completed | Migration, 2 services, 4 API routes, 40 tests; one user-approved deviation (SECURITY DEFINER purchase-guard RPC, see above) |
| Code Generation — U2 | Completed | Approved 2026-09-14 — 2 hooks, 5 components, 3 file extensions, E2E spec, manual checklist; 3 minor design-doc corrections (no architecture impact) |
| Build and Test | Completed | Approved 2026-09-14 — build success, 225/225 tests, 0 lint/type errors, no blocking security finding, E2E deferred to post-deploy; `construction/build-and-test/*.md` |
| Operations | Completed (placeholder) | Release runbook written to `operations/operations.md` — not yet executed (branch not merged/deployed) |

## Key decisions made
| Decision | Answer | Where |
|---|---|---|
| Navigation | 4th dashboard card, like Shop/Creative/Learning | Q1=A |
| Item visuals | Emoji only, no new assets | Q2=A |
| V1 catalog | Bed 100 / Desk 70 / Lamp 40 / Teddy Bear 30 / Plant 50 / Rug 60 (exact) | Q3=A |
| Schema | Multi-room-ready now via `room` column on `house_items`/`house_layout` | Q4=A |
| Admin | None — fixed seed catalog | Q5=A |
| Client state | Extend `coin-context.tsx` with `ownedHouseItems`/`buyHouseItem()` | Q6=A |
| i18n | Localize item names EN/VI via `t()` | Q7=A |
| Locked rooms | Simple grayed-out card, non-clickable | Q8=A |
| Tests | Unit + API + E2E | Q9=C |
| Extensions | Security Yes/blocking, Resiliency Yes, PBT Yes/blocking | Q10/11/12=A |
| Resiliency specifics | Backup&Restore/hours, existing informal change mgmt, existing GH Actions+Vercel CI/CD, Vercel Instant Rollback, direct/in-place deploy, single-region, lightweight incident-response note | R1-R7=A |
| Component structure | `components/my-house/` folder (index.tsx + 4 sub-components) | AppDesign Q1=B |
| Service layer | Two services: house-items.ts + house-layout.ts | AppDesign Q2=A |
| API routes | Flat, mirrors existing naming | AppDesign Q3=A |
| Catalog data-fetching | Dedicated `useHouseItems()` hook, module-cached | AppDesign Q4=B |
| Room navigation | Reusable `<RoomNav>` extracted now | AppDesign Q5=B |
| Item-name localization | Server-side (`getCatalog(supabase, room, locale)`), not client `nameMap` | Post-approval correction |
| Unit split | Keep U1 (schema+service) / U2 (UI) as previewed | UnitsGen Q1=A |
| Build order | Parallel, stub types, reconcile before Build and Test | UnitsGen Q2=B |
| Shared-file ownership | database.types.ts/validation-api.ts=U1; translations.ts/coin-context.tsx/dashboard.tsx=U2 | UnitsGen Q3=A |
| Deployment | U1+U2 ship together, one release | UnitsGen Q4=A |
| `room` enum representation | `rooms` lookup table, not CHECK constraint (non-default) | U1 FD Q1=B |
| Room list data source | New `GET /api/rooms` + `useRooms()` hook, replacing hardcoded client list | U1 FD clarification=B |
| saveLayout ownership check | Reject whole request if any itemId unowned | U1 FD Q2=A |
| Duplicate placement | No server-side check (UX convention only) | U1 FD Q3=A |
| Layout count bound | Raw length <= room's active catalog count | U1 FD Q4=A |
| InsufficientFundsError | Reused from stickers.ts, not duplicated | U1 FD Q5=A |
| Invalid room (catalog GET) | 400 | U1 FD Q6=A |
| Resiliency testing approach | Propose a lightweight DR plan (restore drill, RLS check, purchase-guard chaos check) | U1 NFR Design RESILIENCY-14=B |
| useRooms() total failure | Silent-empty, not hardcoded fallback | U2 FD Q1=A |
| Placed-item rendering | No ownership cross-check (trusts loaded state) | U2 FD Q2=A |
| Resize controls | Omitted for V1 | U2 FD Q3=B |
| Purchase guard implementation | SECURITY DEFINER RPC function (not literal stickers.ts mirror — fixes a real race condition) | Code Gen deviation, user-approved |

## Open items
- **The AI-DLC workflow is done.** What's left is real-world release work, not more AI-DLC
  stages: merge the branch, `supabase db push` the migration, deploy, then work through
  `MANUAL-TEST-CHECKLIST.md`'s new TC-M006–008. Full ordered steps in
  `operations/operations.md`.

## Artifact map
```
aidlc-docs/my-house/
├── aidlc-state.md
├── HANDOVER.md
├── audit.md
└── inception/
    └── reverse-engineering/
        ├── architecture.md            (carried forward from subject-content-db)
        ├── business-overview.md       (carried forward from subject-content-db)
        ├── technology-stack.md        (carried forward from subject-content-db)
        ├── code-structure.md          (carried forward)
        ├── code-quality-assessment.md (carried forward)
        ├── api-documentation.md       (carried forward)
        ├── my-house-findings.md       (NEW — read this first)
        └── reverse-engineering-timestamp.md
    ├── requirements/
    │   ├── requirement-verification-questions.md  (answered)
    │   ├── resiliency-clarification-questions.md  (answered)
    │   └── requirements.md  (approved)
    ├── test-cases/
    │   ├── test-case-questions.md  (answered)
    │   └── test-case-design.md     (approved)
    ├── plans/
    │   ├── execution-plan.md            (approved)
    │   ├── application-design-plan.md   (approved)
    │   └── unit-of-work-plan.md         (approved)
    └── application-design/
        ├── components.md               (approved, amended twice — see audit.md)
        ├── component-methods.md        (approved, amended twice)
        ├── services.md                 (approved, amended twice)
        ├── component-dependency.md     (approved, amended)
        ├── application-design.md       (approved — consolidated summary + Amendments table)
        ├── unit-of-work.md             (approved, amended)
        ├── unit-of-work-dependency.md  (approved, amended)
        └── unit-of-work-story-map.md   (approved, amended)

aidlc-docs/my-house/construction/
├── plans/
│   ├── house-schema-and-service-functional-design-plan.md                    (answered)
│   ├── house-schema-and-service-functional-design-clarification-questions.md (answered)
│   └── house-schema-and-service-nfr-requirements-plan.md                     (no questions needed)
└── house-schema-and-service/
    ├── functional-design/
    │   ├── domain-entities.md       (approved)
    │   ├── business-rules.md        (approved)
    │   └── business-logic-model.md  (approved)
    ├── nfr-requirements/
    │   ├── nfr-requirements.md       (approved)
    │   └── tech-stack-decisions.md   (approved)
    └── nfr-design/
        ├── nfr-design-patterns.md   (approved)
        └── logical-components.md   (approved)

aidlc-docs/my-house/construction/my-house-ui/
├── functional-design/
│   ├── domain-entities.md       (approved)
│   ├── business-rules.md        (approved)
│   ├── business-logic-model.md  (approved)
│   └── frontend-components.md   (approved)
└── nfr-requirements/
    ├── nfr-requirements.md       (approved)
    └── tech-stack-decisions.md   (approved)

aidlc-docs/my-house/construction/plans/
├── house-schema-and-service-code-generation-plan.md  (approved, all 9 steps complete)
└── my-house-ui-code-generation-plan.md               (approved, generation starting)
```

## Application Code Generated So Far (U1 — house-schema-and-service)

```
supabase/migrations/0004_house_items_schema.sql   (NEW — includes purchase_house_item RPC)
lib/services/house-items.ts                       (NEW)
lib/services/house-layout.ts                       (NEW)
lib/database.types.ts                              (MODIFIED — +4 tables, +1 function)
lib/validation/api.ts                              (MODIFIED — +4 schemas)
app/api/house-items/route.ts                        (NEW)
app/api/players/house-items/route.ts                (NEW)
app/api/players/house-layout/route.ts               (NEW)
app/api/rooms/route.ts                              (NEW)
automation_tests/unit/house-items.test.ts           (NEW — 18 tests)
automation_tests/unit/house-items.pbt.test.ts       (NEW — 2 PBT tests)
automation_tests/api/house-items.api.test.ts        (NEW — 20 tests)
automation_tests/unit/_arbitraries.ts               (MODIFIED — +2 PBT generators)
```
Full detail: `aidlc-docs/my-house/construction/house-schema-and-service/code/summary.md`.

## Application Code Generated (U2 — my-house-ui)

```
lib/hooks/use-house-items.ts                    (NEW)
lib/hooks/use-rooms.ts                          (NEW)
components/my-house/layout-math.ts              (NEW — pure position math)
components/my-house/room-nav.tsx                (NEW)
components/my-house/item-catalog.tsx            (NEW)
components/my-house/my-items-strip.tsx          (NEW)
components/my-house/bedroom-canvas.tsx          (NEW)
components/my-house/index.tsx                   (NEW — MyHouse orchestrator)
contexts/coin-context.tsx                       (MODIFIED — +ownedHouseItems/buyHouseItem/hasHouseItem)
components/dashboard.tsx                        (MODIFIED — 4th card, "house" view)
data/translations.ts                            (MODIFIED — UI-chrome keys)
automation_tests/unit/layout-math.test.ts       (NEW — 8 tests)
automation_tests/unit/house-items.pbt.test.ts   (MODIFIED — +PBT-E/PBT-F)
automation_tests/e2e/my-house.spec.ts           (NEW — TC-E018-027)
MANUAL-TEST-CHECKLIST.md                        (MODIFIED — +TC-M006-008)
```
Full detail: `aidlc-docs/my-house/construction/my-house-ui/code/summary.md`.

## Build and Test + Operations Artifacts

```
aidlc-docs/my-house/construction/build-and-test/
├── build-instructions.md
├── unit-test-instructions.md
├── api-test-instructions.md
├── integration-test-instructions.md
├── e2e-test-instructions.md
├── security-test-instructions.md
└── build-and-test-summary.md

aidlc-docs/my-house/operations/
└── operations.md   (release runbook — read this before merging/deploying)
```

## Gotchas for the next operator
- The dashboard is **card-based** (`components/dashboard.tsx` `mainSections` array + local
  `ViewType` state), not a persistent top nav bar, despite the requirement doc's "main navigation
  tab" language — My House will be added the same way as Shop/Creative/Learning.
- `creative_canvas` / `stickers` / `player_stickers` are the closest existing schema analogs for a
  house-items catalog + ownership + placed-layout design — see `my-house-findings.md`.
- **`purchase_house_item` is the first stored procedure in this codebase.** Every other
  feature (stickers, canvas, quiz) uses plain PostgREST calls from the service layer — no
  precedent for this pattern existed before this initiative. It exists because the "obvious"
  mirror of `stickers.ts::purchaseSticker` has a real concurrency bug (see
  `construction/house-schema-and-service/functional-design/business-rules.md` BR-3's amendment
  note) — if you're refactoring `purchaseHouseItem` or writing a similar guard elsewhere,
  read that note first, and consider whether `purchaseSticker` itself should eventually get
  the same fix.
- **`BedroomCanvas` has no `onPlace` prop**, unlike what an early version of
  `frontend-components.md` specified — placement is handled by `MyHouse` via a forwarded
  canvas ref. If you're extending the drag/drop mechanics, start from `components/my-house/
  index.tsx`'s `handleItemDropped`, not `bedroom-canvas.tsx`.
