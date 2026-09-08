# Application Design Plan

## Context

This initiative modifies `components/learning-zone.tsx` (primary), `components/quiz-modal.tsx` (interface update), `data/translations.ts` (content), and introduces `lib/coin-rewards.ts` (new utility).

## Design Artifacts to Generate

- [ ] components.md — Component definitions and responsibilities
- [ ] component-methods.md — Method signatures and purpose
- [ ] services.md — Service/utility definitions
- [ ] component-dependency.md — Dependency relationships and data flow
- [ ] application-design.md — Consolidated design document

---

## Clarifying Questions

Please fill in the `[Answer]:` tag for each question below.

---

### Question 1
Should the difficulty level be shown to students during the quiz (as a visible label or badge on each question)?

A) Yes — show a visual badge (e.g., "Easy ⭐", "Medium ⭐⭐", "Hard ⭐⭐⭐") on each question inside the quiz modal

B) No — difficulty is invisible to students; it only affects the coin calculation at the end

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2
Should the Grade 2 subject sub-view (showing Math → Addition/Subtraction/Times Table) be implemented as a new standalone component, or as inline conditional rendering within the existing `LearningZone` component?

A) New component — extract the sub-view into a separate `Grade2SubjectView` component for cleaner separation

B) Inline — keep all Grade 2 logic inside `LearningZone` using a `selectedSubject` state variable (simpler, fewer files)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3
When the quiz completes, where should the coin amount calculation happen?

A) Inside `QuizModal` — the modal calculates coins from the questions' difficulties, then passes `coinsEarned` via `onComplete(score, total, coinsEarned)`

B) Inside `LearningZone` — the modal passes the list of question difficulties via `onComplete(score, total, difficulties[])`, and `LearningZone` calls `calculateSessionCoins()`

C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

Let me know when you're done filling in the answers.
