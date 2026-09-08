# Business Rules — grade2-subjects-nav

## BR-1: Grade 2 Tab Renders Grade2SubjectView

**Rule**: When the Grade 2 tab is active, `LearningZone` renders `<Grade2SubjectView onSelectPractice={setActiveQuiz} />` instead of the flat `grade2Categories` card grid.

**Rationale**: Implements the two-level navigation hierarchy (FR-1.1).

---

## BR-2: Grade2SubjectView Shows Three Subject Cards

**Rule**: The subject list view must display exactly three cards: Math, Vietnamese, English — in that order.

---

## BR-3: Math Drill-Down

**Rule**: Clicking the Math card navigates to the Math sub-view, which displays three practice cards: Addition, Subtraction, Times Table.

**Implementation**: Internal state change (`selectedSubject: 'math'`). Does NOT call `onSelectPractice`.

---

## BR-4: Back Button Returns to Subject List

**Rule**: The Math sub-view includes a Back button that returns to the subject card list (`selectedSubject: null`).

**Back button must be visible** and distinct from the quiz close button.

---

## BR-5: Vietnamese and English Launch Quiz Directly

**Rule**: Clicking the Vietnamese or English subject card immediately calls `onSelectPractice('grade2Vietnamese')` or `onSelectPractice('grade2English')`. There is no drill-down sub-view for these subjects.

---

## BR-6: Grade 2 Quiz Pools — Size and Selection

**Rule**: Each Grade 2 subject quiz (Vietnamese, English) is backed by a pool of exactly 15 questions. Each session randomly selects 10 from the pool.

**Selection mechanism**: Fisher-Yates shuffle on the full 15-question array, then take the first 10. Computed with `useMemo(…, [])` so the selection is stable for the component lifetime (re-randomised on component remount only).

---

## BR-7: All New Questions Must Have `difficulty`

**Rule**: Every question object in `grade2VietnamesePool` and `grade2EnglishPool` must include `difficulty: randomDifficulty()` (from `lib/coin-rewards.ts`). This is consistent with BR-1 of Unit 1.

---

## BR-8: Grade 2 Category IDs

**Rule**: The quiz category IDs for the new quizzes are:
- `'grade2Vietnamese'` — Grade 2 Vietnamese subject quiz
- `'grade2English'` — Grade 2 English subject quiz

These are new `quizData` keys in `LearningZone`. They also appear as `category` values in `POST /api/quiz/history`. The API already accepts any string that passes Zod validation (category is typed as the known union — see note below).

**Note on API validation**: `lib/validation/api.ts` validates `category` against an enum. `'grade2Vietnamese'` and `'grade2English'` must be added to the `QuizHistorySchema` category enum, otherwise the API will reject history records for these new categories.

---

## BR-9: Existing Quizzes Unchanged

**Rule**: Addition, Subtraction, and Times Table quizzes are functionally identical to their current behaviour. Their entry point changes (accessed through Math sub-view rather than directly), but quiz content, question generation, and scoring remain unchanged.

---

## BR-10: Grade 2 Vietnamese — Content Scope

**Rule**: The 15-question Vietnamese pool covers Grade 2-appropriate topics: word types (noun/verb/adjective), antonyms, sentence capitalisation, punctuation, seasons, family vocabulary, and feeling words. Questions are bilingual (Vietnamese and English UI translations).

---

## BR-11: Grade 2 English — Content Scope

**Rule**: The 15-question English pool covers Grade 2-appropriate topics: parts of speech, antonyms, spelling/plurals, animal vocabulary, seasons, colours (mixing), shapes, and weather. Questions are presented in English only (both UI languages show the same English content, as this is an English-language quiz).

**Exception**: The `title` and any framing text use the UI language. Only the question text and options are English-only — they should have the same string in both `vi` and `en` translation values.
