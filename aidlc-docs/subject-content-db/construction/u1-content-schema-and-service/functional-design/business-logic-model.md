# Business Logic Model — U1 content-schema-and-service

**Status**: Approved (user, 2026-09-09)


## 1. `resolveQuestion(row, subject, uiLocale)`  → `QuestionDto`

```
function resolveQuestion(row, subject, uiLocale):
    effectiveLocale =
        subject.content_mode == 'fixed'  ? subject.target_language   # BR-1.1
                                         : uiLocale                  # BR-1.2

    prompt  = row['prompt_'  + effectiveLocale]
    options = row['options_' + effectiveLocale]

    if prompt is null or options is null or len(options) != 3:
        throw IncompleteQuestionError(row.id)                        # BR-3.1

    return {
        id:           row.id,
        question:     prompt,
        options:      options,          # already string[3]
        correctIndex: row.correct_index,
        difficulty:   row.difficulty,
    }
```

Pure. No I/O. Deterministic. `uiLocale` has **no effect** when `content_mode == 'fixed'`.

## 2. `resolveTitle(subject, uiLocale)` → `string`

```
return uiLocale == 'en' ? subject.title_en : subject.title_vi        # BR-1.4
```

## 3. `rowToDto` / `dtoToWritePayload` (round-trip pair)

```
rowToDto(row, subject, uiLocale)      = resolveQuestion(row, subject, uiLocale)

dtoToWritePayload(dto, subject):
    loc = subject.content_mode == 'fixed' ? subject.target_language : 'vi'
    return {
        ['prompt_'  + loc]: dto.question,
        ['options_' + loc]: dto.options,
        correct_index:      dto.correctIndex,
        difficulty:         dto.difficulty,
    }
```

Round-trip identity (for a `fixed` subject, or a `localized` subject viewed at its base
locale): `dtoToWritePayload(rowToDto(row)) ⊇ { the target-locale prompt/options,
correct_index, difficulty of row }`. See Testable Property TP-3.

## 4. `getSubjectContent(sb, key, uiLocale)` → `SubjectContentDto | null`

```
subject = getSubjectByKey(sb, key)
if subject is null: return null                                      # BR-3.2 → 404

rows = getActiveQuestions(sb, subject.id)          # WHERE is_active
                                                   # ORDER BY sort_order, created_at  BR-3.5
questions = []
for row in rows:
    questions.push(resolveQuestion(row, subject, uiLocale))   # throws → 500  BR-3.1

return {
    key:                subject.key,
    title:              resolveTitle(subject, uiLocale),
    questionsPerSession: subject.questions_per_session,
    questions:          questions,                 # may be []  BR-3.6
}
```

`getActiveQuestions` / `getSubjectByKey` / `listSubjects` are thin Supabase `select`
wrappers; errors from the client propagate (route → 500).

## 5. DB trigger `subject_questions_mode_check()` (pseudo-SQL)

```
BEFORE INSERT OR UPDATE ON subject_questions FOR EACH ROW:
    SELECT content_mode, target_language INTO m, tl
      FROM subjects WHERE id = NEW.subject_id;

    IF m = 'fixed' THEN
        other := (tl = 'vi' ? 'en' : 'vi');
        IF NEW.prompt_<tl> IS NULL OR NEW.options_<tl> IS NULL THEN
            RAISE EXCEPTION 'fixed subject % requires % prompt+options', NEW.subject_id, tl;
        IF NEW.prompt_<other> IS NOT NULL OR NEW.options_<other> IS NOT NULL THEN
            RAISE EXCEPTION 'fixed subject % must not set % text', NEW.subject_id, other;
    ELSE  -- localized
        IF NEW.prompt_vi IS NULL OR NEW.prompt_en IS NULL
           OR NEW.options_vi IS NULL OR NEW.options_en IS NULL THEN
            RAISE EXCEPTION 'localized subject % requires both vi and en text', NEW.subject_id;
    END IF;
    RETURN NEW;
```

(Implemented with dynamic column access via `to_jsonb(NEW)` lookups, or an explicit
`CASE tl WHEN 'vi' THEN NEW.prompt_vi ...` — decided in code generation.)

## 6. Migration order & content flow

```
0002_subject_content_schema.sql
   CREATE TABLE subjects
   CREATE TABLE subject_questions  (+ UNIQUE (subject_id, source_key))
   CREATE INDEX idx_subject_questions_subject_active
   CHECK  options length / correct_index range
   CREATE FUNCTION + TRIGGER subject_questions_mode_check
   RLS: authenticated SELECT
   ALTER quiz_history_category_check  (add grade2Vietnamese, grade2English)

0003_subject_content_seed.sql
   INSERT subjects ... ON CONFLICT (key) DO UPDATE
   INSERT subject_questions ... ON CONFLICT (subject_id, source_key) DO UPDATE
      - shapes/colors/animals: localized (vi+en), source_key 'shapes-001'..., difficulty medium
      - vietnamese(g1): fixed vi, 3 rows, medium
      - english(g1): fixed en, 10 NEW rows, medium
      - grade2Vietnamese: fixed vi, 15 migrated (medium) + ~35 new (40/40/20)
      - grade2English: fixed en, 15 migrated (medium) + ~35 new (40/40/20)
```

---

## 7. Testable Properties (PBT-01 — BLOCKING)

Per the Property-Based Testing extension, every unit with business logic must list its
testable properties here and carry them into code generation.

### C2 `resolve.ts`

| ID | Category | Property | PBT rule | Test |
|---|---|---|---|---|
| TP-1 | Invariant | For any `row` + `subject` with `content_mode='fixed'`, `resolveQuestion(row, subject, L)` produces the **same** `question` & `options` for **every** `L ∈ {vi,en}` — output is independent of `uiLocale`. Equals the `target_language` text. | PBT-03 | `subject-content.pbt.test.ts` → PBT-B |
| TP-2 | Invariant | For `content_mode='localized'`, `resolveQuestion(row, subject, L).question === row['prompt_'+L]` and `.options === row['options_'+L]` for each `L`. `correctIndex`/`difficulty` equal `row.correct_index`/`row.difficulty` in both modes. | PBT-03 | PBT-B |
| TP-3 | Round-trip | For any generated `row` (valid per its subject mode), `dtoToWritePayload(rowToDto(row, subject, base), subject)` reproduces the row's target-locale `prompt`/`options` array (order + values), `correct_index`, and `difficulty`. `f_inv(f(x)) = x` on the persisted content fields. | PBT-02 | PBT-C |
| TP-4 | Invariant | `resolveQuestion` output always has `options.length === 3` and `0 ≤ correctIndex ≤ 2` for any row that passes the generator's validity precondition; an invalid row (null required text) always throws `IncompleteQuestionError`. | PBT-03 | PBT-B + example tests |

### C5 `getSubjectContent`

| ID | Category | Property | Test |
|---|---|---|---|
| TP-5 | Invariant | Given a mocked repo returning `k` active rows (all valid), `getSubjectContent` returns exactly `k` questions, in the repo's order, and never more than the repo returned. Unknown key → `null`. One invalid active row → throws (does not return a short list). | example-based unit tests (oracle = the mock); not PBT (I/O-bound) |

### Generators (PBT-07) — `automation_tests/unit/_arbitraries.ts`

- `optionTripleArb` → `fc.tuple(nonEmptyStr, nonEmptyStr, nonEmptyStr)` as a 3-array
- `difficultyArb` → `fc.constantFrom('easy','medium','hard')`
- `fixedSubjectArb` / `localizedSubjectArb` → `{ content_mode, target_language, title_vi, title_en }`
- `questionRowArb(subject)` → a row valid for that subject's mode (fills the right columns,
  nulls the others), `correct_index` in `0..2`, plus a "corrupted" variant that nulls a
  required column (for the throw-path property)

### Complementary example tests (PBT-10)

Concrete seeded scenarios pinned with explicit expected values:
- `grade2Vietnamese` q1 resolves to its exact Vietnamese prompt for `uiLocale='en'` **and**
  `'vi'` (the bug-fix regression).
- `shapes` q1 resolves to the Vietnamese prompt for `'vi'`, the English prompt for `'en'`.
- an incomplete row throws `IncompleteQuestionError`.

### PBT compliance summary (this unit)

| Rule | Status |
|---|---|
| PBT-01 property identification | ✅ this section |
| PBT-02 round-trip | ✅ TP-3 |
| PBT-03 invariant | ✅ TP-1, TP-2, TP-4 |
| PBT-04 idempotency | N/A — no operation claims idempotency (seed re-run is SQL `ON CONFLICT`, not app logic) |
| PBT-05 oracle | N/A — no reference implementation; `getSubjectContent` uses its mock as an oracle in example tests only |
| PBT-06 stateful | N/A — `resolve.ts` is pure & stateless; the service holds no state |
| PBT-07 generators | ✅ domain arbitraries above |
| PBT-08 shrink/seed | ✅ enforced in Build & Test (CI seed logging) |
| PBT-09 framework | ✅ fast-check (recorded in U1 nfr-requirements) |
| PBT-10 complementary | ✅ example tests listed |
