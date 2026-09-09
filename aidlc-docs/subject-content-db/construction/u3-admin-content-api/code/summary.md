# U3 Code Generation — Summary

**Unit**: admin-content-api
**Status**: Generated 2026-09-09 — awaiting user approval
**Plan**: `construction/plans/u3-admin-content-api-code-generation-plan.md` (12 steps done)

---

## Files created

| File | Purpose |
|---|---|
| `lib/admin-auth.ts` | `isAdminEmail(email, csv)` (fail-closed, case-insensitive, trimmed), `getAdminEmails()` |
| `lib/admin-guard.ts` | `requireAdmin(request)` — auth (401) → `isAdminEmail` (403, `console.warn`) → `{ user, admin: service-role client }`; `isResponse()` type guard |
| `app/api/admin/subjects/route.ts` | `GET` — gated `listSubjects` |
| `app/api/admin/subject-questions/route.ts` | `GET ?subjectKey=` / `POST` / `PATCH` / `DELETE ?id=` — gate + Zod + `validateModeCoverage` + `console.log` audit; PG errors → 400 |
| `automation_tests/unit/admin-auth.test.ts` | 7 tests (TC-U122–U128) |
| `automation_tests/unit/admin-validation.test.ts` | 14 tests (TC-U129–U142) — schemas + `validateModeCoverage` + 2 fast-check properties |

## Files modified

| File | Change |
|---|---|
| `lib/subject-content/resolve.ts` | + `ModeCoverageError`, `validateModeCoverage(row, subject)` (pure) |
| `lib/validation/api.ts` | + `OptionsArraySchema`, `SubjectQuestionCreateSchema`, `SubjectQuestionUpdateSchema` + inferred types (additive; U1's `LocaleSchema` untouched) |
| `lib/services/subject-content.ts` | + `getSubjectById`, `getQuestionById`, `maxSortOrder` |
| `.env.local.example` | + `ADMIN_EMAILS` (with the re-seed-reverts-seeded-rows note) |
| `vitest.config.ts` | coverage `include` + `"!app/api/admin/**"` |
| `MANUAL-TEST-CHECKLIST.md` | filled in TC-M003 (9-step gate + CRUD + mode-coverage check) |

## Deviations

- Added `lib/admin-guard.ts` (not in the plan by name) — the plan said "shared
  `requireAdmin` inline"; a tiny server-only module keeps `lib/admin-auth.ts` pure/testable
  and both routes DRY.

## Verification (local)

| Check | Result |
|---|---|
| `npx vitest run automation_tests/unit automation_tests/api` | ✅ **175 passed** (16 files) — 14 blocking PBT total |
| `npx tsc --noEmit` | ✅ clean for U3 files |
| `npx eslint .` | ✅ **0 errors** (14 warnings, all pre-existing/downgraded) |
| `npx next build --webpack` | ✅ `/api/admin/subjects` + `/api/admin/subject-questions` registered |
| Admin route tests | ⏭️ none (CL2=C) — `app/api/admin/**` excluded from coverage; TC-M003 covers the routes manually |

## Notes

- `validateModeCoverage` runs in the route (nice 400s) **and** the DB trigger
  `subject_questions_mode_check()` from U1 stays as a backstop — a PG error from it is
  translated to a 400.
- `POST` always writes `source_key = NULL`; `sortOrder` defaults to end-of-list.
- `DELETE` is a hard delete and idempotent; deactivation is `PATCH { id, isActive: false }`.
