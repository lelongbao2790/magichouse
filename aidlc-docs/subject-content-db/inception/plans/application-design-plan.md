# Application Design Plan — subject-content-db

**Status**: Awaiting user answers
**Last updated**: 2026-09-09

---

## Purpose

Identify the components, their high-level methods, the service layer, and component
dependencies for this initiative. Most behavioural decisions are already locked in
`requirements.md`; this stage resolves the remaining **structural** design choices, then
generates the design artifacts.

---

## Design Questions

Please fill in each `[Answer]:` tag and say "done".

---

### Question 1 — `subject_questions` text storage (finalizes the "two-table" schema)

Q2=B chose **two tables** (`subjects` + `subject_questions`). C1=A added a per-subject
`content_mode`: `fixed` (one language) vs `localized` (`vi` + `en`). How should question
text be stored on `subject_questions`?

A) **Four nullable columns on `subject_questions`**: `prompt_vi text`, `prompt_en text`,
   `options_vi jsonb`, `options_en jsonb`, plus a shared `correct_index int`. A `fixed`
   subject populates only its target-language pair; a `localized` subject populates both.
   A CHECK/trigger enforces "the required columns for this subject's mode are non-null".
   **Stays two tables.** *(Recommended — honors Q2=B, simplest queries)*

B) **Three tables**: add `subject_question_texts (question_id, locale, prompt, options jsonb)`
   — one row per locale. Fully normalized; `fixed` = 1 text row, `localized` = 2.
   (Deviates from the "two-table" answer.)

C) **Single `prompt`/`options` pair + a `translations jsonb` column** for the optional
   other-locale text on `localized` subjects.

D) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 2 — Where the quiz **title** comes from

Today `t("quizVietnameseGrade2", "title")` → "Quiz Tiếng Việt Lớp 2" / "Grade 2 Vietnamese Quiz".

A) **From the `subjects` table** — `subjects.title_vi` / `subjects.title_en`, returned by
   the questions API and localized by the UI locale (title is UI chrome, always follows the
   UI language even for `fixed` subjects). Remove the `title` keys from `translations.ts`.
   *(Recommended — one source of truth for subject metadata)*

B) **Keep titles in `translations.ts`** as UI chrome; the DB only stores questions. Less to
   migrate, but subject metadata is split across two places.

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 3 — Difficulty: stored per question, or still random per session?

Today every quiz (all subjects) assigns `randomDifficulty()` to each question **at render
time**, and the difficulty badge + coin reward derive from that. Migrated/authored DB
questions can carry a real `difficulty`.

A) **Store a fixed `difficulty` per DB question** (`easy` | `medium` | `hard`). The API
   returns it; the badge and coin calc use it. Difficulty becomes deterministic per
   question (a question is always "medium"). Math practices keep random difficulty (still
   generated). *(Recommended — content authors control difficulty; more meaningful badges)*

B) **Keep `difficulty` nullable / unused for content subjects** — the client keeps calling
   `randomDifficulty()` per session for DB questions too, exactly as today. No behaviour
   change to coins/badges.

C) **Store it, but only for the newly authored Grade 2 questions**; migrated older
   questions stay random (nullable → client randomizes).

D) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 4 — Gameplay API route shape

A) **`GET /api/subjects/[key]/questions?locale=vi`** → `{ data: { title, questions: [...] } }`
   *(Recommended — RESTish, `key` in the path)*

B) **`GET /api/quiz-content?subject=grade2Vietnamese&locale=vi`** — flat, query-only

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 5 — Admin route grouping

A) **`GET /api/admin/subjects`** (list subjects) + **`/api/admin/subject-questions`**
   (`GET ?subjectKey=`, `POST`, `PATCH` `{id,...}`, `DELETE ?id=` or soft-delete via
   `PATCH {is_active:false}`) *(Recommended)*

B) **One route** `/api/admin/subject-questions` handling everything incl. subject listing
   via a query flag

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 6 — Client fetch & caching

A) **A small `useSubjectQuestions(key)` hook** with an in-memory module cache keyed by
   `subjectKey + locale`, cleared on full page reload. `learning-zone.tsx` uses it; the
   pure `pickSessionQuestions` runs on the hook's result each time a quiz opens.
   *(Recommended)*

B) **Fetch inside `learning-zone.tsx`** directly with `useEffect`, no separate hook, no
   cache (re-fetch every quiz open) — matches `sticker-shop.tsx` style

C) Other (describe after [Answer]: tag)

[Answer]:A

---

## Answers Summary
All questions answered **A** (recommended option each): 4-column two-table schema; title
from `subjects`; difficulty stored per question; `/api/subjects/[key]/questions?locale=`;
two admin routes; `useSubjectQuestions` hook + session cache. No ambiguities.

## Mandatory Design Artifacts (generated 2026-09-09)

- [x] `components.md` — component definitions + responsibilities
- [x] `component-methods.md` — method signatures + I/O types
- [x] `services.md` — service definitions + orchestration
- [x] `component-dependency.md` — dependency matrix + data flow
- [x] `application-design.md` — consolidated
