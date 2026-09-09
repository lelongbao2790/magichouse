# Audit Trail — subject-content-db

## Initiative Start
**Timestamp**: 2026-09-09T00:00:00Z
**User request (raw)**:
> The Vietnamese uses English language is not correct when switch web language to English.
> And both data for English and Vietnamese subject is hardcode for now, move it to db
> supabase that project currently use. And update api to get data from that, update more
> data for two subject Vietnamese and English, currently, it has a little data for both
> subject

**Trigger**: `/aidlc`

## Workspace Detection
**Timestamp**: 2026-09-09T00:00:00Z
**Findings**: Brownfield. One prior initiative folder (`grade2-subjects-coin-rewards`,
status COMPLETE). Current request is a new, distinct initiative (content-to-DB migration +
i18n bug fix) with subject-matter overlap but no continuation of the prior (completed)
work. Derived slug: `subject-content-db`. Folder auto-created.

## Reverse Engineering
**Timestamp**: 2026-09-09T00:00:00Z
**Approach**: Reused `architecture.md` / `business-overview.md` / `technology-stack.md`
from the prior initiative (unchanged). Refreshed `code-structure.md`,
`code-quality-assessment.md`, `api-documentation.md` for current code state. Added
`subject-content-findings.md` focused on the quiz-content + i18n implementation this
initiative targets.
**Status**: Awaiting user approval.

## Reverse Engineering — Approval
**Timestamp**: 2026-09-09T00:10:00Z
**AI Prompt**: "Approve & Continue — proceed to Requirements Analysis"
**User Response**: "Approve"
**Status**: Approved

## Requirements Analysis — Questions Posed
**Timestamp**: 2026-09-09T00:10:00Z
**Artifact**: inception/requirements/requirement-verification-questions.md (15 questions:
scope, schema shape, language-bug fix model, English-subject style, grade banks, content
volume, migration delivery, content management, API-failure behavior, quiz_history CHECK
fix, test scope, + 3 extension opt-ins, + open notes)
**Status**: Awaiting user answers.

## Requirements Analysis — Round 1 Answers Received
**Timestamp**: 2026-09-09T00:30:00Z
**Answers**: Q1=C (all static content → DB), Q2=B (subjects + subject_questions tables),
Q3=A (fixed language per subject), Q4=A (English subject fully English), Q5=A (separate
grade banks), Q6=B (~50 per bank), Q7=A (user runs supabase db push), Q8=B (admin write
API, admin role), Q9=A (error + retry, no fallback), Q10=A (fix quiz_history CHECK),
Q11=D (unit + API + E2E + update grade2-subjects.spec), Q12=B (no security ext),
Q13=B (no resiliency ext), Q14=A (full PBT — differs from prior initiative's Partial),
Q15=none.
**Analysis**: 5 ambiguities/interactions found → clarification round 2 created
(fixed vs localized subjects, which banks expand to ~50, admin identity mechanism,
admin API scope, Grade 1 English re-authoring).
**Artifact**: inception/requirements/requirement-clarification-questions.md
**Status**: Awaiting round 2 answers.

## Requirements Analysis — Round 2 Answers Received
**Timestamp**: 2026-09-09T00:45:00Z
**Answers**: C1=A (per-subject content_mode: fixed | localized), C2=C (expand only Grade 2
VN + Grade 2 EN to ~50; Grade 1 VN/EN and preschool migrate at current size), C3=A
(ADMIN_EMAILS env allowlist), C4=A (full CRUD admin API), C5=A (re-author Grade 1 English
fully English).
**Analysis**: No remaining ambiguities — all answers concrete. requirements.md generated.
**Artifact**: inception/requirements/requirements.md
**Status**: Awaiting user approval.

## Requirements Analysis — Approval
**Timestamp**: 2026-09-09T01:00:00Z
**AI Prompt**: "Approve & Continue — proceed to Workflow Planning"
**User Response**: "Approve & continue to Workflow Planning"
**Status**: Approved. User Stories declined (not added).

## Extension Opt-Ins Recorded
- Security Baseline: No (Q12=B) — full rules NOT loaded
- Resiliency Baseline: No (Q13=B) — full rules NOT loaded
- Property-Based Testing: Yes, FULL/blocking (Q14=A) — full rules loaded
  (`extensions/testing/property-based/property-based-testing.md`)

## Workflow Planning
**Timestamp**: 2026-09-09T01:05:00Z
**Decisions**: Execute Test Case Design, Application Design, Units Generation, per-unit
Functional Design + NFR Requirements (light), Code Generation, Build and Test. Skip User
Stories, NFR Design, Infrastructure Design. 3 units proposed (U1 content-schema-and-service
→ U2 gameplay-content-api-and-ui, U3 admin-content-api). Risk: Medium.
**Artifact**: inception/plans/execution-plan.md
**Status**: Awaiting user approval.

## Workflow Planning — Approval
**Timestamp**: 2026-09-09T01:15:00Z
**AI Prompt**: "Approve & Continue — proceed to Test Case Design"
**User Response**: "Approve & continue to Test Case Design"
**Status**: Approved.

## Test Case Design — QA Questions Posed
**Timestamp**: 2026-09-09T01:15:00Z
**Artifact**: inception/test-cases/test-case-questions.md
**Status**: Awaiting user (QA/PM) answers.

## Test Case Design — Round 1 Answers Received
**Timestamp**: 2026-09-09T01:25:00Z
**Answers**: Q1=A,B,C,D,E,G,H (E2E flows); Q2=A,B,C (error tests: 401, unknown key,
API-500 browser retry); Q3=E (manual: deployed-app language check only); Q4=B (Chromium
only); Q5=A (route interception, admin at API layer, no live admin acct); Q6=A,B,C,D,E
(regression: preschool, math, coins, history, grade2 nav); Q7=none.
**Analysis**: contradictions found —
  (1) Q1 omitted F but Q2=C includes the same API-failure browser test;
  (2) Q2 omitted admin error tests (E/F/G) but Q5=A + requirements Q11=D assume admin
      API-layer tests;
  (3) Q3 left content-review / migration-applied / admin-env off the manual checklist;
  (4) Q4=B browser-scope application unclear (new specs only vs whole config).
→ clarification round created.
**Artifact**: inception/test-cases/test-case-clarification-questions.md
**Status**: Awaiting round 2 answers.

## Test Case Design — Round 2 Answers + Design Generated
**Timestamp**: 2026-09-09T01:35:00Z
**Answers**: CL1=A (API-failure test IS a browser E2E via route interception),
CL2=C (NO automated tests for the admin CRUD API — verified manually via TC-M003),
CL3=A (manual checklist gains content review + migration-applied + admin-env checks),
CL4=B (playwright.config.ts → Chromium-only for the whole suite).
**Deviation noted**: CL2=C narrows requirements Q11=D for the admin-API portion — admin
routes get no route tests; `isAdminEmail()` pure helper still unit-tested; `app/api/admin/**`
to be excluded from Vitest coverage globs (flagged for user veto at approval).
**Artifact**: inception/test-cases/test-case-design.md
  - TC-E: 8 new (TC-E009–TC-E017) + modifications to grade2-subjects.spec.ts
  - TC-A: 6 new (TC-A025–TC-A030)
  - PBT: 3 property groups (PBT-A selection invariants, PBT-B language resolution, PBT-C round-trip)
  - TC-M: 5 (TC-M001–TC-M005)
**Status**: Awaiting QA/PM approval.

## Test Case Design — Approval
**Timestamp**: 2026-09-09T01:45:00Z
**AI Prompt**: "Approve & Continue — proceed to Application Design"
**User Response**: "Approve"
**Status**: Approved. TC-E count 8 (+mods), TC-A count 6, PBT 3 groups, TC-M count 5.
Coverage exclusion of `app/api/admin/**` and Chromium-only playwright config accepted
(no objection raised).

## Application Design — Questions Posed
**Timestamp**: 2026-09-09T01:45:00Z
**Artifact**: inception/plans/application-design-plan.md
**Status**: Awaiting user answers.

## Application Design — Answers + Artifacts Generated
**Timestamp**: 2026-09-09T02:00:00Z
**Answers**: Q1..Q6 all = A (all recommended). 4-column two-table schema; title from
`subjects` table; difficulty stored per question (deterministic badge/coins for content
subjects); `GET /api/subjects/[key]/questions?locale=`; two admin routes; `useSubjectQuestions`
hook + module cache. No ambiguities → no follow-ups.
**Artifacts**: inception/application-design/{components,component-methods,services,
component-dependency,application-design}.md — 14 components (C1–C14), 3 pure logic modules
(resolve, quiz-session, admin-auth), 1 service module, 3 API routes, 1 hook, 2 modified
components. Component→unit mapping: U1 {C1,C2,C5,C13-types}, U2 {C3,C6,C9,C10,C11,C12},
U3 {C4,C7,C8,C13-admin-schemas,C14}.
**Status**: Awaiting user approval.

## Application Design — Approval
**Timestamp**: 2026-09-09T02:10:00Z
**AI Prompt**: "Approve & Continue — proceed to Units Generation"
**User Response**: "Approve"
**Status**: Approved.

## Units Generation (Part 1: Planning) — Plan + Questions Posed
**Timestamp**: 2026-09-09T02:10:00Z
**Artifact**: inception/plans/unit-of-work-plan.md
**Status**: Awaiting user answers.

## Units Generation — Part 1 Answers + Part 2 Artifacts
**Timestamp**: 2026-09-09T02:20:00Z
**Answers**: Q1..Q5 all = A. Content authoring stays in U1; sequential U1→U2→U3;
translations.ts key removal in U2 (with C11); U1 owns table types + LocaleSchema, U3 adds
admin schemas additively; config folded per-unit. No ambiguities.
**Artifacts**: inception/application-design/{unit-of-work, unit-of-work-dependency,
unit-of-work-story-map}.md — 3 units, dependency graph (U1 → U2 → U3), integration
checkpoints, rollback plan, full FR/NFR/AC/TC → unit coverage map.
**Status**: Awaiting user approval (Units Generation gate before CONSTRUCTION).

## Units Generation — Approval
**Timestamp**: 2026-09-09T02:30:00Z
**AI Prompt**: "Approve & Continue — proceed to CONSTRUCTION, U1 Functional Design"
**User Response**: "Approve & continue to U1 Functional Design"
**Status**: Approved. Entering CONSTRUCTION phase.

## CONSTRUCTION — U1 Functional Design — Plan + Questions Posed
**Timestamp**: 2026-09-09T02:30:00Z
**Artifact**: construction/plans/u1-content-schema-and-service-functional-design-plan.md
**Status**: Awaiting user answers.

## CONSTRUCTION — U1 Functional Design — Answers + Artifacts
**Timestamp**: 2026-09-09T02:45:00Z
**Answers**: Q1=B (incomplete active question → 500, no silent drop), Q2=A (fixed subject:
non-target columns must be NULL, trigger-enforced), Q3 authored=A (40/40/20), Q3 migrated=F
(all migrated rows → `medium`), Q4=B (10 fresh Grade 1 English questions), Q5=B+Q6=B →
resolved to `source_key` natural key + `ON CONFLICT DO UPDATE` (re-seed reverts admin edits
to seeded rows; flagged for veto).
**Ambiguity resolved**: Q5=B (natural key, DO NOTHING) vs Q6=B (id, DO UPDATE) contradicted
→ reconciled as `(subject_id, source_key)` conflict target + `DO UPDATE` action; documented
in business-rules BR-4.2 and the FD plan.
**Artifacts**: construction/u1-content-schema-and-service/functional-design/{domain-entities,
business-rules,business-logic-model}.md. PBT-01: TP-1 (fixed-mode locale invariance),
TP-2 (localized resolution), TP-3 (round-trip), TP-4 (options/index invariants), TP-5
(service count). PBT-04/05/06 marked N/A with rationale.
**Status**: Awaiting user approval.

## CONSTRUCTION — U1 Functional Design — Approval
**Timestamp**: 2026-09-09T02:55:00Z
**User Response**: "Continue"
**Status**: Approved.

## CONSTRUCTION — U1 NFR Requirements — Questions Posed
**Timestamp**: 2026-09-09T02:55:00Z
**Artifact**: construction/plans/u1-content-schema-and-service-nfr-requirements-plan.md
(light stage — 3 questions: query shape, index footprint, load/availability)
**Status**: Awaiting user answers.

## CONSTRUCTION — U1 NFR Requirements — Answers + Artifacts
**Timestamp**: 2026-09-09T03:05:00Z
**Answers**: Q1=A (two indexed queries), Q2=B (covering index `(subject_id, is_active,
sort_order) INCLUDE (content cols)`), Q3=A (no special load concern).
**Artifacts**: construction/u1-content-schema-and-service/nfr-requirements/{nfr-requirements,
tech-stack-decisions}.md. PBT-09 recorded: fast-check ^3.22.0 (already a devDependency);
no package.json change for U1.
**Status**: Awaiting user approval.

## CONSTRUCTION — U1 NFR Requirements — Approval
**Timestamp**: 2026-09-09T03:10:00Z
**User Response**: "Continue"
**Status**: Approved.

## CONSTRUCTION — U1 Code Generation Part 1 (Planning)
**Timestamp**: 2026-09-09T03:10:00Z
**Artifact**: construction/plans/u1-content-schema-and-service-code-generation-plan.md
(13 numbered steps; 13 files created / 2 modified; migrations 0002 schema + 0003 seed;
resolve.ts + service + types + arbitraries + unit/PBT/api tests + MANUAL-TEST-CHECKLIST.md)
**Status**: Awaiting user approval of the plan.

## CONSTRUCTION — U1 Code Generation Part 1 — Approval
**Timestamp**: 2026-09-09T03:20:00Z
**User Response**: "approve"
**Status**: Approved.

## CONSTRUCTION — U1 Code Generation Part 2 (Generation)
**Timestamp**: 2026-09-09T03:45:00Z
**Created**: supabase/migrations/0002_subject_content_schema.sql,
supabase/migrations/0003_subject_content_seed.sql, lib/subject-content/types.ts,
lib/subject-content/resolve.ts, lib/services/subject-content.ts,
automation_tests/unit/_arbitraries.ts, automation_tests/unit/subject-content-resolve.test.ts
(TC-U069–079), automation_tests/unit/subject-content.pbt.test.ts (TC-U080–085, PBT-B/C),
automation_tests/unit/subject-content-service.test.ts (TC-U086–089),
automation_tests/api/subject-content.api.test.ts (TC-A028–030), MANUAL-TEST-CHECKLIST.md
**Modified**: lib/database.types.ts, lib/validation/api.ts
**Seed**: 7 subjects, 143 questions (shapes/colors/animals 10 each localized;
vietnamese 3 fixed vi; english 10 fresh fixed en; grade2Vietnamese 50 fixed vi;
grade2English 50 fixed en)
**Verification**: `vitest run` 116/116 pass (incl. 6 blocking PBT); `tsc --noEmit` clean
for U1 files; `eslint .` 0 errors; `next build` succeeds. `supabase db reset` NOT run —
Docker unavailable; SQL statically validated (row counts, JSON arrays, correct_index range,
apostrophe escaping). Live DB apply = TC-M002.
**One PBT fix during generation**: corruptedQuestionRowArb initially nulled only the
target-locale prompt; a localized-subject + locale='en' counterexample slipped through →
changed to null both prompts.
**Status**: Awaiting user approval of the generated code.

## CONSTRUCTION — U1 Code Generation Part 2 — Approval
**Timestamp**: 2026-09-09T03:55:00Z
**User Response**: "Continue"
**Status**: Approved. U1 complete.

## CONSTRUCTION — U2 Functional Design — Questions Posed
**Timestamp**: 2026-09-09T03:55:00Z
**Artifact**: construction/plans/u2-gameplay-content-api-and-ui-functional-design-plan.md
(5 questions: language-switch-mid-quiz, selection strategy, hook cache key, empty-questions
handling, translations.ts deletion scope)
**Status**: Awaiting user answers.

## CONSTRUCTION — U2 Functional Design — Answers + Artifacts
**Timestamp**: 2026-09-09T04:05:00Z
**Answers**: Q1=A (freeze session on open — questions+language captured at open, chrome
still localizes), Q2=B (difficulty-balanced selection ~40/40/20 with random fallback),
Q3=A (cache key always `${key}:${locale}`), Q4=B (0 active questions → distinct
"no questions yet" message, Close-only; hook distinguishes error 'load' vs 'empty'),
Q5=A (full removal of 7 quiz sections incl. title).
**Artifacts**: construction/u2-gameplay-content-api-and-ui/functional-design/{domain-entities,
business-rules,business-logic-model,frontend-components}.md. PBT-01 / PBT-A: TP-A1..A6
(size / subset / no-dup / integrity / weak-balance / determinism). PBT-02/04/05/06 N/A.
New data-testid: quiz-loading, quiz-error, quiz-retry-button, quiz-empty, coin-display-amount.
New i18n keys: quiz.loading/loadError/retry/noQuestions.
**Status**: Awaiting user approval.

## CONSTRUCTION — U2 Functional Design — Approval
**Timestamp**: 2026-09-09T04:15:00Z
**User Response**: "Continue"
**Status**: Approved.

## CONSTRUCTION — U2 NFR Requirements — Questions Posed
**Timestamp**: 2026-09-09T04:15:00Z
**Artifact**: construction/plans/u2-gameplay-content-api-and-ui-nfr-requirements-plan.md
(light — 3 questions: component/hook testing approach, new E2E specs in CI, other concerns)
**Codebase finding**: no RTL in project; CI runs vitest without --coverage; existing
component tests only call exported pure fns; 80% threshold not CI-enforced.
**Status**: Awaiting user answers.

## CONSTRUCTION — U2 NFR Requirements — Answers + Artifacts
**Timestamp**: 2026-09-09T04:25:00Z
**Answers**: Q1=B (**add** `@testing-library/react` ^16 + `@testing-library/dom` ^10 as
devDeps; renderHook + RTL component tests), Q2=A (add new E2E specs now, accept red until
deploy), Q3=A (no new perf/a11y concern; bundle shrinks).
**Artifacts**: construction/u2-gameplay-content-api-and-ui/nfr-requirements/{nfr-requirements,
tech-stack-decisions}.md. New devDeps recorded — Build & Test must update ALL lockfiles.
No jest-dom (use Vitest expect + testid queries). vitest.config already jsdom+globals.
**Status**: Awaiting user approval.

## CONSTRUCTION — U2 NFR Requirements — Approval
**Timestamp**: 2026-09-09T04:30:00Z
**User Response**: "continue"
**Status**: Approved.

## CONSTRUCTION — U2 Code Generation Part 1 (Planning)
**Timestamp**: 2026-09-09T04:30:00Z
**Artifact**: construction/plans/u2-gameplay-content-api-and-ui-code-generation-plan.md
(16 steps; 10 files created / 8 modified; RTL devDeps; quiz-session + PBT-A; hook;
GET route; quiz-modal + learning-zone + translations.ts; playwright chromium-only;
API route test TC-A025-027; E2E subject-content.spec TC-E009-017 + grade2-subjects.spec mods)
**Status**: Awaiting user approval of the plan.

## CONSTRUCTION — U2 Code Generation Part 1 — Approval
**Timestamp**: 2026-09-09T04:35:00Z
**User Response**: "approve"
**Status**: Approved.

## CONSTRUCTION — U2 Code Generation Part 2 (Generation)
**Timestamp**: 2026-09-09T05:15:00Z
**Created**: lib/quiz-session.ts, lib/hooks/use-subject-questions.ts,
app/api/subjects/[key]/questions/route.ts, automation_tests/unit/{quiz-session.test.ts,
quiz-session.pbt.test.ts, use-subject-questions.test.tsx, quiz-modal.test.tsx,
learning-zone-content.test.tsx}, automation_tests/api/subject-questions-route.api.test.ts,
automation_tests/e2e/subject-content.spec.ts (TC-U090-121, TC-A025-027+, TC-E009-017)
**Modified**: components/quiz-modal.tsx, components/learning-zone.tsx (freeze-on-open via
`session` state + effect with `prev.key === activeQuiz` guard), data/translations.ts
(7 quiz sections removed + 4 quiz.* keys added), playwright.config.ts (chromium only),
package.json + package-lock.json (@testing-library/react ^16 + @testing-library/dom ^10),
MANUAL-TEST-CHECKLIST.md (TC-M004, TC-M005)
**Deviations**: coin-display.tsx not touched (already has `coin-value` testid);
grade2-subjects.spec.ts not modified (no content-quiz opens in it). bun.lock/pnpm-lock.yaml
NOT synced — bun/pnpm unavailable; Build & Test must run those installs.
**One design fix during generation**: freeze-on-open first done with a ref accessed during
render → eslint `react-hooks/refs` error → reworked to `useState` + `useEffect` with a
functional-update guard (`prev.key === activeQuiz`), + `hasFrozenSession` suppresses the
loading panel once a session is frozen.
**Verification**: `vitest run` 154/154 pass (12 blocking PBT); `tsc --noEmit` clean for U2;
`eslint .` 0 errors (14 warnings, 2 new = downgraded set-state-in-effect); `next build`
OK (`/api/subjects/[key]/questions` registered). E2E not run (needs deployed env + migration).
**Status**: Awaiting user approval of the generated code.

## CONSTRUCTION — U2 Code Generation Part 2 — Approval
**Timestamp**: 2026-09-09T05:25:00Z
**User Response**: "continue"
**Status**: Approved. U2 complete.

## CONSTRUCTION — U3 Functional Design — Questions Posed
**Timestamp**: 2026-09-09T05:25:00Z
**Artifact**: construction/plans/u3-admin-content-api-functional-design-plan.md
(5 questions: isAdminEmail matching + unset behavior, route vs trigger validation,
DELETE semantics, list response shape, admin source_key)
**Status**: Awaiting user answers.

## CONSTRUCTION — U3 Functional Design — Answers + Artifacts
**Timestamp**: 2026-09-09T05:40:00Z
**Answers**: Q1..Q5 all = A. Fail-closed gate (unset ADMIN_EMAILS → no admins);
case-insensitive trimmed exact match; validate mode-coverage in the route (+trigger backstop);
DELETE hard-deletes (deactivate via PATCH isActive:false); admin list returns raw
snake_case rows; admins cannot set source_key (admin rows always NULL).
**Artifacts**: construction/u3-admin-content-api/functional-design/{domain-entities,
business-rules,business-logic-model}.md. PBT-01: TP-U3-1 (isAdminEmail), TP-U3-2
(validateModeCoverage), TP-U3-3 (schemas) — mostly example-based (small surface).
Recorded: no admin ROUTE tests (CL2=C) is scope, not a PBT finding.
**Status**: Awaiting user approval.

## CONSTRUCTION — U3 Functional Design — Approval
**Timestamp**: 2026-09-09T05:50:00Z
**User Response**: "continue"
**Status**: Approved.

## CONSTRUCTION — U3 NFR Requirements — Questions Posed
**Timestamp**: 2026-09-09T05:50:00Z
**Artifact**: construction/plans/u3-admin-content-api-nfr-requirements-plan.md
(light — 3 Qs: log 403s, rate limiting, other)
**Status**: Awaiting user answers.

## CONSTRUCTION — U3 NFR Requirements — Answers + Artifacts
**Timestamp**: 2026-09-09T05:55:00Z
**Answers**: Q1=A (console.warn on 403), Q2=A (platform rate limiting), Q3=A (no other concern).
**Artifacts**: construction/u3-admin-content-api/nfr-requirements/{nfr-requirements,
tech-stack-decisions}.md. No dependency changes. `app/api/admin/**` excluded from vitest
coverage (CL2=C).
**Status**: Awaiting user approval.

## CONSTRUCTION — U3 NFR Requirements — Approval
**Timestamp**: 2026-09-09T06:00:00Z
**User Response**: "continue"
**Status**: Approved.

## CONSTRUCTION — U3 Code Generation Part 1 (Planning)
**Timestamp**: 2026-09-09T06:00:00Z
**Artifact**: construction/plans/u3-admin-content-api-code-generation-plan.md
(12 steps; 5 files created / 6 modified; admin-auth, validateModeCoverage, admin Zod
schemas, 3 service read helpers, 2 admin routes, .env.local.example, vitest coverage
exclude, 2 unit test files, TC-M003. No new deps.)
**Status**: Awaiting user approval of the plan.

## CONSTRUCTION — U3 Code Generation Part 1 — Approval
**Timestamp**: 2026-09-09T06:05:00Z
**User Response**: "approve"
**Status**: Approved.

## CONSTRUCTION — U3 Code Generation Part 2 (Generation)
**Timestamp**: 2026-09-09T06:35:00Z
**Created**: lib/admin-auth.ts, lib/admin-guard.ts, app/api/admin/subjects/route.ts,
app/api/admin/subject-questions/route.ts, automation_tests/unit/{admin-auth.test.ts,
admin-validation.test.ts} (TC-U122-142)
**Modified**: lib/subject-content/resolve.ts (+ModeCoverageError, validateModeCoverage),
lib/validation/api.ts (+OptionsArraySchema, SubjectQuestionCreate/UpdateSchema),
lib/services/subject-content.ts (+getSubjectById, getQuestionById, maxSortOrder),
.env.local.example (+ADMIN_EMAILS), vitest.config.ts (+"!app/api/admin/**"),
MANUAL-TEST-CHECKLIST.md (TC-M003 filled)
**Deviation**: added lib/admin-guard.ts (plan said inline requireAdmin) — keeps admin-auth
pure and both routes DRY.
**Verification**: `vitest run` 175/175 pass (14 blocking PBT — U1 3 + U2 6 + U3 2 PBT tests
+ the rest); `tsc --noEmit` clean for U3; `eslint .` 0 errors; `next build` OK
(/api/admin/subjects + /api/admin/subject-questions registered). No admin route tests (CL2=C).
**Status**: Awaiting user approval of the generated code. This is the last unit —
Build and Test is next.

## CONSTRUCTION — U3 Code Generation Part 2 — Approval
**Timestamp**: 2026-09-09T06:40:00Z
**User Response**: "continue" (×2)
**Status**: Approved. All 3 units complete.

## CONSTRUCTION — Build and Test Stage
**Timestamp**: 2026-09-09T07:00:00Z
**Build Status**: Success (next build; lint 0 errors; tsc clean for new code)
**Test Status**: Pass — 175/175 unit+api (16 files); 14 blocking PBT, no findings.
E2E (TC-E009–E017, Chromium) NOT run — needs deployed env + applied migration.
5 TC-M manual items pending deploy.
**Coverage**: global line threshold (80%) NOT met (~30%) — pre-existing structural gap,
NOT enforced in CI. Documented in build-and-test-summary.md + unit-test-instructions.md.
**Dependencies**: `@testing-library/react` + `@testing-library/dom` synced into ALL THREE
lockfiles (bun.lock via local bun 1.4.2, pnpm-lock.yaml via local pnpm 12.3.4,
package-lock.json via npm).
**CI changes**: ci.yml INITIATIVE → subject-content-db (+ Pages index card text);
playwright.config.ts chromium-only; vitest.config.ts coverage exclude app/api/admin/**.
**Files generated**: construction/build-and-test/{build-instructions, unit-test-instructions,
api-test-instructions, integration-test-instructions, e2e-test-instructions,
security-test-instructions, build-and-test-summary}.md
**PBT compliance**: PBT-01/02/03/07/08/09/10 ✅; PBT-04/05/06 N/A. No blocking findings.
**Status**: Awaiting user approval. Next: OPERATIONS (placeholder).

## CONSTRUCTION — Build and Test — Approval
**Timestamp**: 2026-09-09T07:05:00Z
**User Response**: "approve"
**Status**: Approved.

## OPERATIONS — Placeholder
**Timestamp**: 2026-09-09T07:05:00Z
**Artifact**: operations/operations.md — manual release runbook (merge → set ADMIN_EMAILS →
supabase db push → deploy → MANUAL-TEST-CHECKLIST), rollback notes, ad-hoc monitoring,
known follow-ups.
**Status**: No automated actions (placeholder phase).

## INITIATIVE COMPLETE
**Timestamp**: 2026-09-09T07:05:00Z
All AI-DLC phases finished. 3 units delivered. Release is a manual step (see
operations/operations.md). Code lives in the repo working tree (uncommitted); the user
merges/deploys.
