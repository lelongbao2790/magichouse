# U2 Functional Design Plan — gameplay-content-api-and-ui

**Status**: Answered — artifacts generated 2026-09-09
**Last updated**: 2026-09-09

## Answers
- Q1=A — **freeze the session on open** (questions + language captured at open; UI toggle
  changes only chrome; both fixed and localized subjects)
- Q2=B — **difficulty-balanced selection**: target ~40% easy / ~40% medium / ~20% hard for
  the session, falling back to random when a bucket can't be filled
- Q3=A — hook cache key is always `${key}:${locale}`
- Q4=B — subject with **0 active questions** → a distinct "no questions yet" message
  (Close only, no Retry). Client distinguishes `load` error (Retry) from `empty` (no Retry).
- Q5=A — full removal of the 7 quiz sections incl. `title`; keep `categories`, `quiz.*`,
  math titles, and non-quiz sections

## Plan — DONE 2026-09-09
- [x] domain-entities.md
- [x] business-rules.md
- [x] business-logic-model.md (+ PBT-01 / PBT-A)
- [x] frontend-components.md

**Approved** by user 2026-09-09.

Unit U2 = the player-facing path: `pickSessionQuestions` util, `GET /api/subjects/[key]/questions`,
`useSubjectQuestions` hook, `quiz-modal.tsx` loading/error states, `learning-zone.tsx`
hybrid `quizData`, `translations.ts` key removal.

---

## Plan (executed after answers)
- [ ] `functional-design/domain-entities.md` — the client-side view of a session
- [ ] `functional-design/business-rules.md` — selection, fetch/cache, loading/error/empty,
      language-switch-mid-quiz, translations.ts cleanup, math coexistence
- [ ] `functional-design/business-logic-model.md` — `pickSessionQuestions` algorithm,
      hook state machine, `learning-zone` wiring; **Testable Properties** (PBT-01, PBT-A)
- [ ] `functional-design/frontend-components.md` — `QuizModal` / `LearningZone` prop &
      state changes, the `useSubjectQuestions` hook, data-testid additions

---

## Questions

Fill in each `[Answer]:` tag and say "done".

---

### Q1 — Language switch while a quiz is open

FR-4.5 says a `fixed`-subject quiz must **not** change text when the UI language toggles
mid-quiz. For **localized** subjects (preschool) the requirement is silent. What should the
open quiz do when the UI language changes mid-session?

A) **Freeze the session on open** — the 10 questions (and their language) are captured when
   the quiz opens; toggling the UI language changes only the chrome (buttons, badge) until
   the quiz is closed and reopened. Applies to *both* fixed and localized subjects. Matches
   TC-E011 ("switch, then **reopen**") and TC-E012. *(Recommended — no mid-quiz content
   swap, simplest, consistent)*

B) **Live-swap localized subjects** — a preschool quiz re-fetches and re-renders in the new
   language immediately (may reshuffle / change which 10 questions show); fixed subjects
   still frozen

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Q2 — Session selection strategy

`pickSessionQuestions(pool, n)` chooses the 10 questions shown. Difficulty is now stored
per question (AD Q3=A).

A) **Pure random** — uniform random `n` from the active pool, shuffled. No difficulty
   awareness. Simple; PBT-A already specced for this. *(Recommended)*

B) **Difficulty-balanced** — try to fill the session with a mix (e.g. ~4 easy / ~4 medium /
   ~2 hard) when the pool allows, falling back to random

C) Other (describe after [Answer]: tag)

[Answer]:B

---

### Q3 — Hook cache key for `fixed` subjects

A `fixed` subject's content is identical for `?locale=vi` and `?locale=en`. Toggling the UI
language would still trigger a second fetch if the cache key includes the locale.

A) **Key always includes locale** (`${key}:${locale}`) — one redundant fetch for a fixed
   subject the first time each language is used; dead simple. *(Recommended — a fixed
   subject is ~50 small rows; the extra fetch is trivial and the code stays uniform)*

B) **Key omits locale for fixed subjects** — the hook checks the subject's mode (needs the
   subject metadata first) and caches fixed content once

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Q4 — Subject exists but has zero active questions

`getSubjectContent` returns `{ questions: [] }` (BR-3.6) rather than a 404. On the client:

A) **Treat an empty question set as a load failure** — show the same error + Retry UI as a
   network/500 error; no quiz starts *(Recommended — a subject with no questions is a
   content bug, and `QuizModal` can't run a 0-question quiz)*

B) **Show a distinct "no questions yet" message** (no Retry, just Close)

C) Other (describe after [Answer]: tag)

[Answer]:B

---

### Q5 — `data/translations.ts` — what exactly is removed

Confirm the deletion scope (C12):

A) **Remove** every key under `quizShapes`, `quizColors`, `quizAnimals`, `quizVietnamese`,
   `quizEnglish`, `quizVietnameseGrade2`, `quizEnglishGrade2` — **including their `title`**.
   **Keep** `categories`, all `quiz.*` labels/buttons, `quizMath` / `quizAddition` /
   `quizSubtraction` / `quizTimesTable` (math titles — still code-generated), and every
   non-quiz section. *(Recommended — matches AD Q2=A)*

B) Keep the `title` keys in `translations.ts` too (don't fully rely on `subjects.title_*`)

C) Other (describe after [Answer]: tag)

[Answer]:A
