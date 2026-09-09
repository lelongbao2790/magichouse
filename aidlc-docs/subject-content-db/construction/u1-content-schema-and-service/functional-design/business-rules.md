# Business Rules — U1 content-schema-and-service

## BR-1 — Language resolution (the bug fix)

**BR-1.1** For a question whose subject has `content_mode = 'fixed'`, the effective
language is `subject.target_language` **regardless of the requested UI locale**.
`resolveQuestion(row, subject, uiLocale)` uses `prompt_<target>` / `options_<target>` and
ignores `uiLocale`.

**BR-1.2** For `content_mode = 'localized'`, the effective language is the requested
`uiLocale`; `resolveQuestion` uses `prompt_<uiLocale>` / `options_<uiLocale>`.

**BR-1.3** `correct_index` and `difficulty` are language-independent — passed through
unchanged for both modes.

**BR-1.4** The subject **title** always follows the UI locale (`resolveTitle` →
`title_<uiLocale>`), for both modes. Titles are UI chrome, not lesson content.

**BR-1.5** `uiLocale` defaults to `'vi'` when absent/invalid at the API boundary
(`LocaleSchema` with a default).

---

## BR-2 — Mode coverage (data integrity)

**BR-2.1** `fixed` + `target_language = L`: a row MUST have non-null `prompt_L` and
`options_L`; the other locale's `prompt` and `options` MUST be null.

**BR-2.2** `localized`: a row MUST have all of `prompt_vi`, `prompt_en`, `options_vi`,
`options_en` non-null.

**BR-2.3** Any `options_*` present MUST be a JSON array of exactly 3 non-empty strings.

**BR-2.4** `correct_index` ∈ [0, 2].

**BR-2.5** BR-2.1 / BR-2.2 are enforced by the DB trigger `subject_questions_mode_check()`
on INSERT and UPDATE (it looks up the parent subject). BR-2.3 / BR-2.4 are plain CHECK
constraints. The trigger raises `EXCEPTION` with a clear message on violation.

**BR-2.6** Because the trigger blocks bad rows at write time, `IncompleteQuestionError`
(BR-3.1) is effectively unreachable via normal writes — it is a defensive guard for
direct-SQL tampering or a future schema change.

---

## BR-3 — `getSubjectContent` behaviour

**BR-3.1** If an **active** row cannot be resolved (missing required-locale text →
`IncompleteQuestionError`), `getSubjectContent` **throws** — the route returns HTTP 500 and
the client shows the retry UI (Q1 = B). It does **not** silently drop the row.

**BR-3.2** An unknown `key` → `getSubjectContent` returns `null` → route returns 404.

**BR-3.3** Inactive rows (`is_active = false`) are **excluded** by the query, never resolved,
never counted. This is not an error.

**BR-3.4** The service returns **all** active rows for the subject (no server-side
limiting). Session subsetting is the client's job (U2 `pickSessionQuestions`).

**BR-3.5** Rows are ordered by `sort_order ASC, created_at ASC` — a stable, deterministic
order; the client shuffles.

**BR-3.6** A subject with **zero** active questions returns `SubjectContentDto` with
`questions: []` (not an error, not 404). The client (U2) treats an empty list as a load
failure and shows the retry/empty state.

---

## BR-4 — Migration & seed rules

**BR-4.1** Schema migration `0002_subject_content_schema.sql` is idempotent: `CREATE TABLE
IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER /
POLICY IF EXISTS` then create. The `quiz_history` CHECK is replaced via
`ALTER TABLE quiz_history DROP CONSTRAINT IF EXISTS quiz_history_category_check,
ADD CONSTRAINT quiz_history_category_check CHECK (...)`. The prior constraint text is kept
in a SQL comment for reversal.

**BR-4.2** Seed migration `0003_subject_content_seed.sql`:
- `subjects`: `INSERT ... ON CONFLICT (key) DO UPDATE SET title_vi=EXCLUDED.title_vi, …`
  (every non-key column) — re-run realigns subject metadata to the file.
- `subject_questions`: every seeded row carries a stable `source_key`
  (`'<subjectKey>-NNN'`). `INSERT ... ON CONFLICT (subject_id, source_key) DO UPDATE SET`
  the content columns (`prompt_*`, `options_*`, `correct_index`, `difficulty`, `is_active`,
  `sort_order`) `= EXCLUDED.*`.
- Consequence (accepted, Q6 = B): re-running `0003` **reverts admin-API edits to seeded
  rows**. Admin-created rows (NULL `source_key`) and admin edits to non-seeded rows are
  untouched. This trade-off is documented in `MANUAL-TEST-CHECKLIST.md` and the migration
  header comment.

**BR-4.3** Correct answers for **migrated** questions are taken from the `correctIndex`
literals currently in `components/learning-zone.tsx` (mapped positionally to the
`translations.ts` `qN` keys). This mapping is done once, by hand, and captured in the seed
SQL; the old code is deleted in U2.

**BR-4.4** Grade 1 English is **not** migrated question-for-question — it is replaced with
10 fresh fully-English Grade 1 questions (Q4 = B): sight words, letter sounds, simple
phonics, at ~6-year-old level, `difficulty = medium` (Q3 migrated = F).

**BR-4.5** Content authoring counts (target):
| subject | migrated | new | total active | difficulty |
|---|---|---|---|---|
| shapes / colors / animals | 10 each | 0 | 10 each | all `medium` |
| vietnamese (g1) | 3 | 0 | 3 | all `medium` |
| english (g1) | 0 (replaced) | 10 | 10 | all `medium` |
| grade2Vietnamese | 15 | ~35 | ~50 | 15 `medium` + 35 @ 40/40/20 |
| grade2English | 15 | ~35 | ~50 | 15 `medium` + 35 @ 40/40/20 |

**BR-4.6** Authored content constraints: every question exactly 3 options, exactly one
correct; Vietnamese-subject text fully Vietnamese with correct diacritics; English-subject
text fully English; age-appropriate for Grade 1–2; no near-duplicate questions within a
subject. Reviewed via TC-M001.

---

## BR-5 — RLS

**BR-5.1** `subjects` and `subject_questions`: `FOR SELECT USING (auth.role() =
'authenticated')`. No INSERT/UPDATE/DELETE policies.

**BR-5.2** Migrations and the admin route (service-role client) bypass RLS. The admin
route's own gate (U3) is the only write authorization.

---

## BR-6 — Type parity

**BR-6.1** `lib/database.types.ts` gains `subjects` and `subject_questions` table types that
exactly match the migration columns. `options_vi` / `options_en` typed as `string[] | null`
(the app always writes/reads string arrays; the DB column is `jsonb`).

**BR-6.2** `Difficulty` is imported from `lib/coin-rewards.ts` (not redefined).
