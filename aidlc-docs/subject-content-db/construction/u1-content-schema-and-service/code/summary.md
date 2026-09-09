# U1 Code Generation — Summary

**Unit**: content-schema-and-service
**Status**: Approved (user, 2026-09-09)
**Plan**: `construction/plans/u1-content-schema-and-service-code-generation-plan.md` (all 13 steps [x])

---

## Files created

| File | Purpose |
|---|---|
| `supabase/migrations/0002_subject_content_schema.sql` | `subjects` + `subject_questions` tables, covering index, `subject_questions_mode_check()` trigger, `updated_at` triggers, RLS (authenticated SELECT), `quiz_history.category` CHECK widened to add `grade2Vietnamese` / `grade2English` |
| `supabase/migrations/0003_subject_content_seed.sql` | 7 `subjects` rows + 143 `subject_questions` rows. `ON CONFLICT … DO UPDATE` (idempotent; re-seed resets seeded rows — BR-4.2) |
| `lib/subject-content/types.ts` | `Locale`, `ContentMode`, `QuestionDto`, `SubjectContentDto`; re-exports `Difficulty` |
| `lib/subject-content/resolve.ts` | `resolveQuestion` (the bug fix: `fixed` → target language, ignores UI locale), `resolveTitle`, `effectiveLocale`, `rowToDto`, `dtoToWritePayload`, `IncompleteQuestionError` |
| `lib/services/subject-content.ts` | `listSubjects`, `getSubjectByKey`, `getActiveQuestions`, `getSubjectContent` (orchestrator); write fns (`createQuestion`/`updateQuestion`/`setQuestionActive`/`deleteQuestion`/`listAllQuestionsForSubject`) — implemented, wired to a route in U3 |
| `automation_tests/unit/_arbitraries.ts` | fast-check domain generators (PBT-07) |
| `automation_tests/unit/subject-content-resolve.test.ts` | 11 example tests (TC-U069–U079) |
| `automation_tests/unit/subject-content.pbt.test.ts` | 6 blocking property tests (TC-U080–U085) — PBT-B, PBT-C |
| `automation_tests/unit/subject-content-service.test.ts` | 4 tests (TC-U086–U089) — mocked Supabase |
| `automation_tests/api/subject-content.api.test.ts` | 3 tests — TC-A028, TC-A029, TC-A030 |
| `MANUAL-TEST-CHECKLIST.md` (repo root) | TC-M001, TC-M002 (TC-M003/004/005 are placeholders for U3/U2) |

## Files modified

| File | Change |
|---|---|
| `lib/database.types.ts` | + `subjects` and `subject_questions` table types; + `SubjectRow`, `SubjectQuestionRow` aliases |
| `lib/validation/api.ts` | + `LocaleSchema` (`z.enum(['vi','en'])`) + `LocaleInput` type |

## Seed content counts (row totals)

| subject | mode | rows | notes |
|---|---|---|---|
| shapes / colors / animals | localized | 10 / 10 / 10 | migrated from `data/translations.ts`; difficulty `medium` |
| vietnamese (G1) | fixed vi | 3 | migrated; `medium` |
| english (G1) | fixed en | 10 | **fresh** fully-English (Q4=B); `medium` |
| grade2Vietnamese | fixed vi | 50 | 15 migrated (`medium`) + 35 authored (~16 easy / ~12 medium / ~7 hard) |
| grade2English | fixed en | 50 | 15 migrated (`medium`) + 35 authored (~16 easy / ~13 medium / ~6 hard) |

Difficulty spread of the authored Grade 2 questions is close to the 40/40/20 target and is
finalised at **TC-M001** review.

## Verification run (local)

| Check | Result |
|---|---|
| `npx tsc --noEmit` (new/changed files) | ✅ clean (pre-existing errors in `data/stickers.ts`, `lib/services/{canvas,player}.ts`, `debug-hook-test.ts` are unrelated and predate this unit) |
| `npx vitest run automation_tests/unit automation_tests/api` | ✅ **116 passed** (8 files) — incl. 6 blocking PBT |
| `npx eslint .` | ✅ 0 errors (14 pre-existing warnings, none in U1 files) |
| `npx next build --webpack` | ✅ compiles + builds; route list unchanged (U1 adds no routes) |
| `supabase db reset` (local apply) | ⏳ **not run — Docker unavailable in this environment.** SQL statically validated: 7 subjects + 143 questions, all `correct_index ∈ [0,2]`, all option arrays valid 3-element JSON, apostrophes SQL-escaped. Live apply + row-count check = **TC-M002** (user runs `supabase db push`). |

## Notes / deviations

- **Q5=B + Q6=B reconciliation**: `subject_questions.source_key` (stable per seeded row,
  NULL for admin-created) + `ON CONFLICT (subject_id, source_key) DO UPDATE`. Re-running
  `0003` reverts admin edits to *seeded* rows; admin-created rows are untouched. Documented
  in the migration header and `MANUAL-TEST-CHECKLIST.md`.
- `database.types.ts` types `options_vi`/`options_en` as `string[] | null` (not `Json`) —
  intentional app-level narrowing (BR-6.1); the Supabase client round-trips string arrays
  through the `jsonb` column.
- `_arbitraries.ts` does not match the vitest test glob, so it is a helper module, not a
  test file.
- U1 leaves `data/translations.ts`, `components/**`, `app/api/**` untouched — the running
  app is unaffected until U2.
