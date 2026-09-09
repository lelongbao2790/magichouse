# U1 Code Generation Plan — content-schema-and-service

**Status**: Part 1 approved — Part 2 executed 2026-09-09 (all 13 steps [x])
**Last updated**: 2026-09-09
**Summary**: `../u1-content-schema-and-service/code/summary.md`

Step status: [x] 1 [x] 2 [x] 3 [x] 4 [x] 5 [x] 6 [x] 7 [x] 8 [x] 9 [x] 10 [x] 11
[x] 12 (tsc/vitest/eslint/next-build green; `supabase db reset` not run — Docker
unavailable, SQL statically validated) [x] 13
**This plan is the single source of truth for U1 code generation.**

**Workspace root**: `/Users/brian/Github_Repo/magichouse-dev/magichouse` (brownfield —
modify existing files in place, never create `*_new`/`*_modified` copies).

**Stories / requirements covered**: FR-1, FR-2, FR-6, NFR (U1), AC-3, AC-4, AC-7;
PBT-01/02/03/07/10 (TP-1..TP-5).

**Dependencies**: none (foundation unit).

---

## Step 1 — DB schema migration `supabase/migrations/0002_subject_content_schema.sql`  [ ]

Create (idempotent — `IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP … IF EXISTS`):

1. `subjects` table — columns per `domain-entities.md`; `key` UNIQUE; CHECKs on `grade`,
   `target_language`, `content_mode`, `questions_per_session > 0`.
2. `subject_questions` table — columns per `domain-entities.md`; FK `subject_id` →
   `subjects(id)` ON DELETE CASCADE; `source_key` text NULL; `UNIQUE (subject_id, source_key)`;
   CHECK `correct_index BETWEEN 0 AND 2`; CHECK
   `options_vi IS NULL OR jsonb_array_length(options_vi) = 3` (same for `options_en`);
   CHECK `difficulty IN ('easy','medium','hard')`.
3. Covering index
   `CREATE INDEX IF NOT EXISTS idx_subject_questions_subject_active
    ON subject_questions (subject_id, is_active, sort_order)
    INCLUDE (prompt_vi, prompt_en, options_vi, options_en, correct_index, difficulty);`
4. `updated_at` triggers on both tables reusing `update_updated_at_column()` (from `0001`).
5. Function + trigger `subject_questions_mode_check()` — `BEFORE INSERT OR UPDATE FOR EACH
   ROW`; logic per `business-logic-model.md` §5 (looks up parent `content_mode` /
   `target_language`; enforces BR-2.1 / BR-2.2; `RAISE EXCEPTION` on violation).
6. RLS: `ENABLE ROW LEVEL SECURITY` on both; `CREATE POLICY … FOR SELECT USING
   (auth.role() = 'authenticated')` on both (drop-if-exists first).
7. `quiz_history` CHECK swap:
   `ALTER TABLE quiz_history DROP CONSTRAINT IF EXISTS quiz_history_category_check;`
   `ALTER TABLE quiz_history ADD CONSTRAINT quiz_history_category_check CHECK (category IN
   ('shapes','colors','animals','math','vietnamese','english','addition','subtraction',
   'timesTable','grade2Vietnamese','grade2English'));`
   Header comment records the prior 9-value list for reversal.

**Verify**: `supabase db reset` (local) applies `0001`+`0002` cleanly; `\d subject_questions`
shows the trigger + covering index.

---

## Step 2 — Seed migration `supabase/migrations/0003_subject_content_seed.sql`  [ ]

Header comment: explains `ON CONFLICT DO UPDATE` semantics and the re-seed-reverts-admin-edits
trade-off (BR-4.2).

1. `INSERT INTO subjects (key, title_vi, title_en, grade, target_language, content_mode,
   questions_per_session, sort_order) VALUES … ON CONFLICT (key) DO UPDATE SET
   title_vi = EXCLUDED.title_vi, …;` — the 7 rows from `domain-entities.md`.
2. `subject_questions` inserts, grouped by subject, each row with a stable
   `source_key` (`'<key>-NNN'`), `ON CONFLICT (subject_id, source_key) DO UPDATE SET
   prompt_vi = EXCLUDED.prompt_vi, prompt_en = EXCLUDED.prompt_en,
   options_vi = EXCLUDED.options_vi, options_en = EXCLUDED.options_en,
   correct_index = EXCLUDED.correct_index, difficulty = EXCLUDED.difficulty,
   is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;`
   `subject_id` resolved via `(SELECT id FROM subjects WHERE key = '<key>')`.

**Verify**: `supabase db reset`; row counts match Step 3 below; `TC-A030` passes.

---

## Step 3 — Author & encode seed content  [ ]  (the largest step)

Per `business-rules.md` BR-4.5 / BR-4.6:

| subject | rows | `content_mode` | text | difficulty |
|---|---|---|---|---|
| `shapes` | 10 | localized | migrate `quizShapes` q1–q10 (vi + en) from `data/translations.ts`; correct answers from `learning-zone.tsx` `quizData.shapes` `correctIndex` literals `[1,0,1,2,2,1,2,1,2,2]` | all `medium` |
| `colors` | 10 | localized | migrate `quizColors`; correct `[1,2,0,1,2,0,1,0,2,1]` | all `medium` |
| `animals` | 10 | localized | migrate `quizAnimals`; correct `[1,1,1,1,0,2,1,2,0,0]` | all `medium` |
| `vietnamese` | 3 | fixed (vi) | migrate `quizVietnamese` q1–q3 (vi only); options: q1 `["A","B","C"]` idx 0, q2 `["N","M","L"]` idx 1, q3 vi options idx 2 | all `medium` |
| `english` | 10 | fixed (en) | **10 fresh** fully-English Grade 1 questions (sight words / letters / phonics) — authored | all `medium` |
| `grade2Vietnamese` | ~50 | fixed (vi) | migrate `quizVietnameseGrade2` q1–q15 (vi only) with correct indices `[1,0,2,1,0,2,1,2,1,1,0,2,1,0,2]` + author ~35 more | 15 `medium` + 35 @ ~40% easy / ~40% medium / ~20% hard |
| `grade2English` | ~50 | fixed (en) | migrate `quizEnglishGrade2` q1–q15 (en only) with correct indices `[2,1,2,1,0,2,1,0,2,0,1,0,1,2,0]` + author ~35 more | 15 `medium` + 35 @ 40/40/20 |

- Every question: exactly 3 options, one correct.
- `sort_order` = sequential within subject (migrated first, then authored).
- Authored content reviewed at TC-M001 (checklist item created in Step 9).
- **Confirm the `correctIndex` literal arrays above against `components/learning-zone.tsx`
  at generation time** — they are transcribed here from the current file and must be
  re-verified line-by-line before encoding.

---

## Step 4 — Types: `lib/database.types.ts`  [ ]

Add `subjects` and `subject_questions` to `Database['public']['Tables']` (Row / Insert /
Update / Relationships), matching the migration exactly. `options_vi` / `options_en` typed
`string[] | null` (write path always uses string arrays). Export `SubjectRow`,
`SubjectQuestionRow` via the existing `Tables<>` alias pattern.

---

## Step 5 — Pure logic: `lib/subject-content/types.ts` + `lib/subject-content/resolve.ts`  [ ]

- `types.ts`: `Locale`, `ContentMode`, `QuestionDto`, `SubjectContentDto` (re-export
  `Difficulty` from `lib/coin-rewards.ts`).
- `resolve.ts`: `IncompleteQuestionError`, `resolveQuestion`, `resolveTitle`, `rowToDto`,
  `dtoToWritePayload` — algorithms per `business-logic-model.md` §1–§3. No imports beyond
  the two type modules.

---

## Step 6 — Validation: `lib/validation/api.ts`  [ ]

Add `export const LocaleSchema = z.enum(['vi','en'])` and `export type LocaleInput =
z.infer<typeof LocaleSchema>`. (Admin schemas are U3 — do **not** add them here now.)

---

## Step 7 — Service: `lib/services/subject-content.ts`  [ ]

- Reads: `listSubjects`, `getSubjectByKey`, `getActiveQuestions`, `getSubjectContent`
  (orchestrator per `business-logic-model.md` §4 — two queries, Q1=A).
- Write fns (`createQuestion`, `updateQuestion`, `deleteQuestion`, `setQuestionActive`,
  `listAllQuestionsForSubject`): **declare + implement the Supabase calls now** but they
  are only *wired to a route* in U3. Keep them exported.
- First arg `SupabaseClient<Database>` (project convention).

---

## Step 8 — Test utilities: `automation_tests/unit/_arbitraries.ts`  [ ]

fast-check arbitraries per `business-logic-model.md` §7: `nonEmptyStringArb`,
`optionTripleArb`, `difficultyArb`, `localeArb`, `fixedSubjectArb`, `localizedSubjectArb`,
`questionRowArb(subject)` (valid) + `corruptedQuestionRowArb(subject)` (nulls a required
column). Reusable, exported (PBT-07).

---

## Step 9 — Unit tests  [ ]

`automation_tests/unit/subject-content-resolve.test.ts` (example-based, PBT-10):
- `resolveQuestion` fixed: `grade2Vietnamese`-shaped row → Vietnamese text for locale `vi`
  **and** `en` (TP-1 concrete)
- `resolveQuestion` localized: `shapes`-shaped row → vi for `vi`, en for `en`
- incomplete row → `IncompleteQuestionError`
- `resolveTitle` → `title_en` for `en`, `title_vi` for `vi`
- `rowToDto` / `dtoToWritePayload` concrete round-trip

`automation_tests/unit/subject-content.pbt.test.ts` (fast-check, BLOCKING):
- **PBT-B**: TP-1 (fixed → locale-independent), TP-2 (localized → locale-following),
  TP-4 (options length 3, correctIndex 0..2; corrupted → throws)
- **PBT-C**: TP-3 (row → DTO → write payload preserves target-locale prompt/options/
  correct_index/difficulty)

`automation_tests/unit/subject-content-service.test.ts` (mocked `SupabaseClient`):
- `getSubjectContent`: k active rows → k questions in order (TP-5); unknown key → `null`;
  one corrupted active row → throws; empty → `{ questions: [] }`
- `getActiveQuestions` issues the `is_active` filter + `sort_order` order

---

## Step 10 — API / static tests: `automation_tests/api/subject-content.api.test.ts`  [ ]

- **TC-A028**: resolution for a `fixed` subject is identical for `locale=vi` and `locale=en`
  (via `resolveQuestion`, no server)
- **TC-A029**: resolution for a `localized` subject follows the locale
- **TC-A030**: read `supabase/migrations/0003…`? No — read `0002_subject_content_schema.sql`
  and assert its `quiz_history_category_check` text contains `grade2Vietnamese` and
  `grade2English`

(Route-level TC-A025–027 are U2.)

---

## Step 11 — Manual checklist: create `MANUAL-TEST-CHECKLIST.md` (workspace root)  [ ]

New file. Add **TC-M001** (content review) and **TC-M002** (migration applied) with the
full text from `test-case-design.md`. (TC-M003 added in U3; TC-M004/005 in U2.)

---

## Step 12 — Local verification  [ ]

- `bunx tsc --noEmit` — types compile
- `bunx vitest run automation_tests/unit automation_tests/api` — U1 tests green, PBT green
- `supabase db reset` — `0001`+`0002`+`0003` apply; spot-check row counts
- `bun run lint`
- Confirm the app still builds (`bun run build`) — `data/translations.ts` untouched by U1,
  so the existing UI is unaffected.

---

## Step 13 — Documentation  [ ]

`aidlc-docs/subject-content-db/construction/u1-content-schema-and-service/code/summary.md` —
list files created/modified, migration apply instructions, test results.

---

## Files created / modified (U1)

**Created**: `supabase/migrations/0002_subject_content_schema.sql`,
`supabase/migrations/0003_subject_content_seed.sql`,
`lib/subject-content/types.ts`, `lib/subject-content/resolve.ts`,
`lib/services/subject-content.ts`,
`automation_tests/unit/_arbitraries.ts`,
`automation_tests/unit/subject-content-resolve.test.ts`,
`automation_tests/unit/subject-content.pbt.test.ts`,
`automation_tests/unit/subject-content-service.test.ts`,
`automation_tests/api/subject-content.api.test.ts`,
`MANUAL-TEST-CHECKLIST.md`

**Modified**: `lib/database.types.ts`, `lib/validation/api.ts`

**Untouched by U1** (U2/U3): `data/translations.ts`, `components/**`, `app/api/**`,
`playwright.config.ts`, `vitest.config.ts`, `.github/workflows/ci.yml`, `package.json`
