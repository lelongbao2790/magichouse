# AI-DLC State Tracking

## Project Information
- **Initiative Slug**: subject-content-db
- **Project Type**: Brownfield
- **Start Date**: 2026-09-09T00:00:00Z
- **Current Stage**: COMPLETE — all AI-DLC phases finished 2026-09-09 (Operations = placeholder; release runbook in operations/operations.md)

## Workspace State
- **Existing Code**: Yes
- **Reverse Engineering Needed**: Yes (artifacts generated — carried forward + refreshed from grade2-subjects-coin-rewards)
- **Workspace Root**: /Users/brian/Github_Repo/magichouse-dev/magichouse

## Code Location Rules
- **Application Code**: /Users/brian/Github_Repo/magichouse-dev/magichouse (workspace root — NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/subject-content-db/ only

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | No | Requirements Analysis (Q12=B) |
| Resiliency Baseline | No | Requirements Analysis (Q13=B) |
| Property-Based Testing | Yes — FULL / blocking | Requirements Analysis (Q14=A) |

## Test Scope
- **Selection**: Unit + API + E2E, plus update existing `automation_tests/e2e/grade2-subjects.spec.ts` for async loading (Q11=D)
- **Unit**: session-selection util, content service, language resolution — incl. blocking PBT (fast-check)
- **API**: `automation_tests/api/` — new gameplay questions route + admin CRUD route contracts + quiz_history CHECK
- **E2E**: `automation_tests/e2e/` — Vietnamese subject shows Vietnamese text with UI in English; async load/error states
- **Test Case Design file**: aidlc-docs/subject-content-db/inception/test-cases/test-case-design.md
- **TC-E count**: 8 new (TC-E009–TC-E017) + grade2-subjects.spec.ts modified
- **TC-A count**: 6 new (TC-A025–TC-A030)
- **PBT groups**: 3 (blocking)
- **TC-M count**: 5 (TC-M001–TC-M005) → MANUAL-TEST-CHECKLIST.md
- **Admin CRUD API**: NO automated route tests (CL2=C) — manual TC-M003; `app/api/admin/**` excluded from coverage globs
- **E2E browsers**: Chromium only (CL4=B) — playwright.config.ts to be reduced

## What this initiative is

Move the hardcoded Vietnamese and English **subject quiz content** out of
`data/translations.ts` into the Supabase database; add an API + service layer to serve it;
fix the bug where the Vietnamese subject renders in English when the UI language is set to
English; and expand the question banks for both subjects (currently very small).

## Stage Progress

### INCEPTION PHASE
- [x] Workspace Detection — Completed 2026-09-09
- [x] Reverse Engineering — Approved by user 2026-09-09
- [x] Requirements Analysis — Approved by user 2026-09-09 (2 clarification rounds)
- [ ] User Stories — SKIP (Workflow Planning)
- [x] Workflow Planning — Approved by user 2026-09-09
- [x] Test Case Design — Approved by user 2026-09-09 (2 QA rounds) — TC-E009–017, TC-A025–030, 3 PBT groups, TC-M001–005
- [x] Application Design — Approved by user 2026-09-09 — 14 components C1–C14
- [x] Units Generation — Approved by user 2026-09-09 — 3 units U1→U2→U3

### CONSTRUCTION PHASE (per unit, order U1 → U2 → U3)
- [x] U1 Functional Design — Approved by user 2026-09-09 — domain-entities, business-rules, business-logic-model (+PBT-01 TP-1..TP-5)
- [x] U1 NFR Requirements — Approved by user 2026-09-09 (PBT-09 = fast-check; covering index)
- [x] U1 Code Generation — Part 1 approved + Part 2 executed 2026-09-09 (AWAITING USER APPROVAL of generated code)
      - Created: migrations 0002 (schema) + 0003 (seed: 7 subjects, 143 questions), lib/subject-content/{types,resolve}.ts, lib/services/subject-content.ts, 4 test files, MANUAL-TEST-CHECKLIST.md
      - Modified: lib/database.types.ts, lib/validation/api.ts
      - Verify: 116 tests pass (incl. 6 blocking PBT); tsc/eslint/next-build clean; supabase db reset NOT run (no Docker) — SQL statically validated
- [x] U1 Code Generation — Approved by user 2026-09-09
- [x] U2 Functional Design — Approved by user 2026-09-09
- [x] U2 NFR Requirements — Approved by user 2026-09-09 (Q1=B: add @testing-library/react + @testing-library/dom)
- [x] U2 Code Generation — Part 1 approved + Part 2 executed 2026-09-09 (AWAITING USER APPROVAL of code)
      - Created: lib/quiz-session.ts, lib/hooks/use-subject-questions.ts, app/api/subjects/[key]/questions/route.ts, 6 test files (unit/PBT/hook/modal/learning-zone/api-route), e2e/subject-content.spec.ts
      - Modified: components/quiz-modal.tsx, components/learning-zone.tsx, data/translations.ts (removed 7 quiz sections + 4 new keys), playwright.config.ts (chromium-only), package.json (+RTL devDeps), MANUAL-TEST-CHECKLIST.md (TC-M004/005)
      - Verify: 154 unit+api tests pass (12 blocking PBT); tsc clean; eslint 0 errors; next build OK; E2E not run (needs deploy)
      - ⚠️ bun.lock / pnpm-lock.yaml NOT synced (bun/pnpm unavailable) — Build & Test must run bun install + pnpm install
- [x] U2 Code Generation — Approved by user 2026-09-09
- [x] U3 Functional Design — Approved by user 2026-09-09
- [x] U3 NFR Requirements — Approved by user 2026-09-09 (no dep changes)
- [x] U3 Code Generation — Part 1 approved + Part 2 executed 2026-09-09 (AWAITING USER APPROVAL of code)
      - Created: lib/admin-auth.ts, lib/admin-guard.ts, app/api/admin/subjects/route.ts, app/api/admin/subject-questions/route.ts, admin-auth.test.ts, admin-validation.test.ts
      - Modified: lib/subject-content/resolve.ts (+validateModeCoverage), lib/validation/api.ts (+admin schemas), lib/services/subject-content.ts (+3 read helpers), .env.local.example (+ADMIN_EMAILS), vitest.config.ts (exclude app/api/admin/**), MANUAL-TEST-CHECKLIST.md (TC-M003)
      - Verify: 175 unit+api tests pass (14 blocking PBT); tsc clean; eslint 0 errors; next build OK (both admin routes registered); no admin route tests (CL2=C)
- [x] U3 Code Generation — Approved by user 2026-09-09
- [x] NFR Design — SKIPPED
- [x] Infrastructure Design — SKIPPED
- [x] Build and Test — Approved by user 2026-09-09
      - 175 unit+api tests pass (14 blocking PBT, no findings); lint 0 errors; tsc clean (new code); next build OK
      - E2E deferred to post-deploy (needs migration applied); 5 manual TC-M items pending deploy
      - Coverage threshold NOT met (~30%, pre-existing, not CI-enforced) — documented
      - CI: INITIATIVE var → subject-content-db; playwright chromium-only; all 3 lockfiles synced
      - Artifacts: construction/build-and-test/{build,unit-test,api-test,integration-test,e2e-test,security-test}-instructions.md + build-and-test-summary.md

### OPERATIONS PHASE
- [x] Operations — PLACEHOLDER (no automated actions). Manual release runbook: operations/operations.md

## Execution Plan Summary
- **Stages to Execute**: Test Case Design, Application Design, Units Generation, Functional Design (×3), NFR Requirements (×3), Code Generation, Build and Test
- **Stages to Skip**: User Stories, NFR Design, Infrastructure Design
- **Units of Work**: 3 (U1 → U2, U3)

### OPERATIONS PHASE
- [ ] Operations — PLACEHOLDER

## Current Status
- **Lifecycle Phase**: INCEPTION
- **Current Stage**: Reverse Engineering complete — awaiting approval
- **Next Stage**: Requirements Analysis
