# U1 Functional Design Plan — content-schema-and-service

**Status**: Answered — artifacts generated 2026-09-09
**Last updated**: 2026-09-09

## Answers
- Q1=B — incomplete active question → **fail the request (500)**; client shows retry UI
- Q2=A — `fixed` subject: non-target-language columns **must be NULL** (trigger enforces)
- Q3 authored=A (40% easy / 40% medium / 20% hard); migrated=F (**`medium`** for every
  migrated row — preschool, Grade 1, the existing 15 Grade 2 VN/EN)
- Q4=B — **10 fresh** fully-English Grade 1 questions (sight words / letters / phonics),
  not tied to the old vocabulary items
- Q5=B + Q6=B — **resolved**: `subject_questions` carries a `source_key` (stable per seeded
  row, NULL for admin-created); seed uses `INSERT … ON CONFLICT (subject_id, source_key)
  DO UPDATE SET <content columns> = EXCLUDED.<...>`. `subjects` uses `ON CONFLICT (key)
  DO UPDATE`. Re-running `0003` **resets seeded rows to their file values**; admin-created
  rows (NULL `source_key`) and admin edits to *non-seeded* rows are untouched; admin edits
  to *seeded* rows are reverted on re-seed (accepted — Q6=B). *(Flag at approval if the
  `source_key` mechanism isn't what you intended by Q5=B + Q6=B.)*

## Plan — DONE 2026-09-09

Unit U1 = the DB schema, the language-resolution logic (`resolve.ts`), the read service,
the DB types, and all seed content.

---

## Plan (executed after answers)

- [x] `functional-design/domain-entities.md`
- [x] `functional-design/business-rules.md`
- [x] `functional-design/business-logic-model.md` (incl. **Testable Properties** — PBT-01)
- [x] (no `frontend-components.md` — U1 has no UI)

---

## Questions

Fill in each `[Answer]:` tag and say "done".

---

### Q1 — Incomplete active question: skip or fail?

If `getSubjectContent` encounters an **active** `subject_questions` row missing the text its
subject's `content_mode` requires (`IncompleteQuestionError` from `resolveQuestion`):

A) **Skip that row, `console.warn`, return the rest** — the quiz still runs with the valid
   questions. If the surviving count drops below `questions_per_session`, the session just
   shows fewer. *(Recommended — resilient; the mode trigger + tests should prevent this
   anyway)*

B) **Fail the whole request (500)** — the client shows the retry UI; nothing renders until
   the data is fixed

C) **Skip, and if fewer than N remain, still return them but also include an `incomplete`
   count in the response** for observability

D) Other (describe after [Answer]: tag)

[Answer]:B

---

### Q2 — For a `fixed` subject, is the non-target-language text allowed?

A `fixed` subject (e.g. Grade 2 Vietnamese, `target_language = vi`) must have
`prompt_vi` + `options_vi`. What about `prompt_en` / `options_en` on the same row?

A) **Must be NULL** — a `fixed` subject stores exactly one language; the trigger rejects a
   row that also sets the non-target columns. Keeps the data honest. *(Recommended)*

B) **Allowed but ignored** — the trigger only checks the target pair is present; extra
   translations can sit in the other columns for future use

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Q3 — Difficulty for the content questions

Every `subject_questions` row needs a `difficulty` (`easy` | `medium` | `hard`).

**For the ~100 newly authored Grade 2 questions**, target distribution:

A) **~40% easy / ~40% medium / ~20% hard** per subject *(Recommended — most questions
   approachable, a few stretch)*

B) **~33/33/33** even split

C) **~50 easy / 30 medium / 20 hard**

D) Other (describe after [Answer]: tag)

**For the migrated older questions** (preschool, Grade 1, the existing 15 Grade 2 VN/EN —
which currently get a *random* difficulty each session):

E) **Assign `easy`** to all migrated preschool + Grade 1 questions; assign the existing 15
   Grade 2 VN/EN a spread matching the chosen distribution *(Recommended)*

F) **Assign `medium`** to everything migrated

G) Other (describe after [Answer]: tag)

[Answer Q3 (authored)]:A
[Answer Q3 (migrated)]:F

---

### Q4 — Grade 1 English re-authoring approach

The current 10 Grade 1 English questions are "What does 'X' mean?" with Vietnamese options.

A) **Keep the same 10 vocabulary items** (Apple, Dog, Red, Cat, Blue, One, Sun, Book, Big,
   Happy) but rewrite each as a fully-English question with English options
   (e.g. "Which picture word means a fruit you eat? → Apple / Chair / Car") *(Recommended —
   preserves the taught vocabulary)*

B) **Write 10 fresh fully-English Grade 1 questions** (simple sight words, letters, basic
   phonics) — not tied to the old items

C) Other (describe after [Answer]: tag)

[Answer]:B

---

### Q5 — Seed idempotency / stable ids

The seed migration (`0003`) must be safe to re-run.

A) **Hardcoded UUID literals** for every `subjects` and `subject_questions` row in the SQL,
   with `INSERT ... ON CONFLICT (id) DO NOTHING` *(Recommended — fully deterministic,
   readable diffs when content changes)*

B) **`gen_random_uuid()` + a natural unique key** (e.g. `subjects.key`, and
   `subject_questions (subject_id, sort_order)`) with `ON CONFLICT (natural key) DO NOTHING`

C) Other (describe after [Answer]: tag)

[Answer]:B

---

### Q6 — Updating an existing question's text via a later migration

If you later fix a typo in a seeded question, `ON CONFLICT DO NOTHING` won't apply it.

A) **Accept it** — text fixes go through the admin API (U3), not new migrations. Seed
   migrations only ever *add*. *(Recommended)*

B) **Use `ON CONFLICT (id) DO UPDATE`** in seed migrations so re-running a corrected seed
   file overwrites — but then admin-API edits get clobbered if the seed re-runs

C) Other (describe after [Answer]: tag)

[Answer]:B
