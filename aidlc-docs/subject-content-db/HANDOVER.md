# Handover — subject-content-db

**Last updated**: 2026-09-09T00:00:00Z

## Where things stand
**✅ AI-DLC COMPLETE (2026-09-09).** All 3 units built and approved; Build and Test approved;
Operations = placeholder (manual release runbook in `operations/operations.md`).
The code is in the working tree, uncommitted — the user merges + deploys.

**175 unit+api tests pass** (14 blocking PBT, no findings); lint 0 errors; `next build` OK;
all 3 lockfiles synced. E2E (Chromium, TC-E009–E017) not run — needs the migration applied
to a deployed env. Coverage threshold not met (~30%, pre-existing, not CI-enforced).

**To release** (see `construction/build-and-test/build-and-test-summary.md` §Next Steps):
1. Merge → CI green (E2E may be red 1 cycle).
2. Set `ADMIN_EMAILS` in the Vercel env.
3. `supabase db push` → project `eoelyqphaixgqlkyoxau`.
4. Deploy.
5. Work through `MANUAL-TEST-CHECKLIST.md` (TC-M001–M005).

---

## History (INCEPTION) Workspace Detection ✅, Reverse Engineering ✅, Requirements Analysis ✅,
Workflow Planning ✅, Test Case Design ✅, Application Design ✅ — all approved.
Units Generation ✅. **CONSTRUCTION phase**, U1 (content-schema-and-service). U1 Functional
U1 Functional Design ✅, NFR Requirements ✅, Code Generation ✅ — **U1 complete** (code approved; 116 tests pass; `supabase db reset` not run
— no Docker). U2 FD ✅, U2 NFR ✅ (Q1=B adds `@testing-library/react` + `@testing-library/dom` devDeps).
U2 ✅ complete. **U3 Code Generation Part 2 done** — code written & locally verified
(175 unit+api tests pass; tsc/eslint/next-build clean; no admin route tests per CL2=C) —
**awaiting approval**. Then **Build & Test** (final stage).

U3 FD: fail-closed admin gate (`ADMIN_EMAILS` unset → nobody is admin); route-level
mode-coverage validation + DB-trigger backstop; `DELETE ?id=` hard-deletes; deactivate via
`PATCH isActive:false`; admin list endpoints return raw snake_case rows; admin-created rows
always `source_key = NULL`. No automated route tests (CL2=C) — `isAdminEmail` +
`validateModeCoverage` + schemas get unit tests; TC-M003 covers the rest.

⚠️ **Build & Test must run `bun install` AND `pnpm install`** — U2 added
`@testing-library/react`/`@testing-library/dom` devDeps but only `package-lock.json` was
synced here (bun/pnpm unavailable in this env). CI's `bun install --frozen-lockfile` fails
until `bun.lock` is updated.

U2 FD decisions: freeze the session (questions + language) when a quiz opens (chrome still
localizes); `pickSessionQuestions` is difficulty-balanced (~40/40/20, random fallback);
hook cache key `${key}:${locale}`; 0 active questions → distinct "no questions yet" (Close
only) via `error: 'load' | 'empty'`; full removal of the 7 quiz sections from
`translations.ts` (+ 4 new `quiz.*` chrome keys).

U1 deliverables: `supabase/migrations/0002` (schema+trigger+RLS+quiz_history CHECK) &
`0003` (7 subjects, 143 questions), `lib/subject-content/{types,resolve}.ts`,
`lib/services/subject-content.ts`, `lib/database.types.ts` (+types), `lib/validation/api.ts`
(+LocaleSchema), 4 test files, `MANUAL-TEST-CHECKLIST.md` (TC-M001/002).

Key U1 FD decisions: incomplete active question → HTTP 500 (no silent drop); `fixed`
subject rows must NULL the non-target-language columns (DB trigger); all migrated content →
`difficulty = medium`, new Grade 2 → 40/40/20; Grade 1 English = 10 fresh questions;
seed uses `source_key` + `ON CONFLICT DO UPDATE` (re-seed reverts admin edits to seeded
rows — accepted).

Execute: Test Case Design → Application Design → Units Generation → per-unit Functional
Design + NFR Requirements (light) → Code Generation → Build and Test.
Skip: User Stories, NFR Design, Infrastructure Design.
Units: **U1** content-schema-and-service → **U2** gameplay-content-api-and-ui, **U3**
admin-content-api.

## What this initiative is
Move hardcoded Vietnamese & English subject quiz content from `data/translations.ts` into
Supabase; serve it via a new API/service layer; fix the bug where the Vietnamese subject
shows English text when the UI is switched to English; and add many more questions to both
subject banks.

## Stage history
| Stage | Status | Notes |
|---|---|---|
| Workspace Detection | Completed | Brownfield; workspace root now on macOS (`/Users/brian/Github_Repo/magichouse-dev/magichouse`) |
| Reverse Engineering | Completed | Approved by user 2026-09-09 |
| Requirements Analysis | Completed | Approved by user 2026-09-09; 2 clarification rounds |
| Workflow Planning | Completed | Approved by user 2026-09-09; 3 units; Medium risk |
| Test Case Design | Completed | Approved by user 2026-09-09; 2 QA rounds |
| Application Design | Completed | Approved by user 2026-09-09; 14 components C1–C14 |
| Units Generation | Completed | Approved by user 2026-09-09; 3 units U1→U2→U3 |
| U1 Functional Design | Completed | Approved by user 2026-09-09 |
| U1 NFR Requirements | Completed | Approved by user 2026-09-09 |
| U1 Code Generation | Completed | Approved by user 2026-09-09 |
| U2 Functional Design | Completed | Approved by user 2026-09-09 |
| U2 NFR Requirements | Completed | Approved by user 2026-09-09 |
| U2 Code Generation | Completed | Approved by user 2026-09-09 |
| U3 Functional Design | Completed | Approved by user 2026-09-09 |
| U3 NFR Requirements | Completed | Approved by user 2026-09-09 |
| U3 Code Generation | Completed | Approved by user 2026-09-09 |
| NFR Design / Infrastructure Design | Skipped | Per execution plan |
| Build and Test | Completed | Approved by user 2026-09-09 |
| Operations | Placeholder | Manual release runbook: `operations/operations.md` |

## Key decisions made
| Decision | Answer | Where |
|---|---|---|
| Migration scope | ALL static content (preschool + G1/G2 language subjects); math stays in code | Q1=C |
| Schema | `subjects` + `subject_questions` (normalized) | Q2=B |
| Bug fix model | per-subject `content_mode`: `fixed` (VN/EN subjects) vs `localized` (preschool) | Q3=A / C1=A |
| English subject style | fully English; Grade 1 English re-authored | Q4=A / C5=A |
| Content volume | Grade 2 VN → ~50, Grade 2 EN → ~50; rest migrate as-is; 10 per session | Q6=B / C2=C |
| Migration delivery | committed migration; user runs `supabase db push` | Q7=A |
| Admin | CRUD API gated by `ADMIN_EMAILS` env allowlist; no UI | Q8=B / C3=A / C4=A |
| API-failure UX | error + Retry in quiz modal, no fallback | Q9=A |
| quiz_history CHECK | fixed in this migration | Q10=A |
| Tests | unit + API + E2E + update grade2-subjects.spec | Q11=D |
| Admin API test coverage | **none automated** — manual TC-M003 only; `app/api/admin/**` excluded from coverage globs | TCD CL2=C |
| E2E browsers | Chromium only (whole `playwright.config.ts`) | TCD CL4=B |
| Extensions | Security No, Resiliency No, **PBT full/blocking** | Q12/13/14 |
| Schema text storage | 4 nullable `*_vi`/`*_en` cols on `subject_questions` (2 tables) + trigger for mode coverage | AD Q1=A |
| Quiz title source | `subjects.title_vi/title_en`; title keys removed from `translations.ts` | AD Q2=A |
| Difficulty | stored per DB question (deterministic badge+coins); math practices keep random | AD Q3=A |
| Routes | `GET /api/subjects/[key]/questions?locale=`; `/api/admin/subjects` + `/api/admin/subject-questions` | AD Q4/Q5=A |
| Client data | `useSubjectQuestions(key)` hook + module cache keyed `key:locale` | AD Q6=A |

## Open items
- Approve `application-design/`.
- Units Generation next → then per-unit Functional Design (produces PBT-01 property lists) +
  NFR Requirements (records PBT-09 = fast-check) → Code Generation → Build & Test.
- Content authoring (~50 Grade 2 VN + ~50 Grade 2 EN + re-author Grade 1 EN) happens in U1
  code generation; TC-M001 is the review gate.
- CI `INITIATIVE` env var still points at the old slug — address in Build & Test.
- `vitest.config.ts` coverage `include` to gain `!app/api/admin/**` (CL2=C).

## Artifact map
```
aidlc-docs/subject-content-db/
├── aidlc-state.md
├── HANDOVER.md
├── audit.md
└── inception/
    ├── reverse-engineering/
    │   ├── architecture.md            (carried forward)
    │   ├── business-overview.md       (carried forward)
    │   ├── technology-stack.md        (carried forward)
    │   ├── code-structure.md          (refreshed)
    │   ├── code-quality-assessment.md (refreshed)
    │   ├── api-documentation.md       (refreshed)
    │   ├── subject-content-findings.md (NEW — read this first)
    │   └── reverse-engineering-timestamp.md
    ├── requirements/
    │   ├── requirement-verification-questions.md   (answered)
    │   ├── requirement-clarification-questions.md   (answered)
    │   └── requirements.md   (awaiting approval)
    ├── plans/
    │   ├── execution-plan.md            (approved)
    │   ├── application-design-plan.md   (answered — all A)
    │   └── unit-of-work-plan.md         (answered — all A)
construction/subject-content-db/
    ├── plans/u1-content-schema-and-service-functional-design-plan.md  (answered)
    └── u1-content-schema-and-service/
        ├── functional-design/  (approved)
        ├── nfr-requirements/   (approved)
        └── code/summary.md     (approved)
    construction/subject-content-db/u2-gameplay-content-api-and-ui/  (all approved)
    construction/subject-content-db/u3-admin-content-api/   (all approved)
    construction/subject-content-db/build-and-test/
        build-instructions.md · unit-test-instructions.md · api-test-instructions.md
        integration-test-instructions.md · e2e-test-instructions.md
        security-test-instructions.md · build-and-test-summary.md  (awaiting approval)
    ├── application-design/
    │   ├── components.md · component-methods.md · services.md · component-dependency.md
    │   ├── application-design.md   (approved)
    │   ├── unit-of-work.md · unit-of-work-dependency.md · unit-of-work-story-map.md  (awaiting approval)
    └── test-cases/
        ├── test-case-questions.md            (answered)
        ├── test-case-clarification-questions.md (answered)
        └── test-case-design.md               (awaiting QA/PM approval)
```

## Gotchas for the next operator
- The prior initiative authored `quizEnglishGrade2` with identical `vi` and `en` strings —
  that is why the English subject "works" today; it is duplicated data, not real i18n.
- `correctIndex` for every content quiz is a literal in `learning-zone.tsx`, separate from
  the option text — the DB model should store the correct answer alongside the options.
- CI `INITIATIVE` env var is hardcoded to the old initiative slug.
