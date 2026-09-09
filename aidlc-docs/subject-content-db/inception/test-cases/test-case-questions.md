# Test Case Design — QA/PM Questions — subject-content-db

You're wearing the QA/PM hat here. These answers decide exactly which automated and manual
tests get written during Code Generation. Fill in each `[Answer]:` tag and say "done".

**Coverage areas identified from the requirements** (acceptance criteria AC-1..AC-9):
- Language bug fix — Vietnamese subject stays Vietnamese with UI in English
- Preschool subjects still follow the UI language
- Grade 2 Vietnamese / English banks expanded (~50), 10 shown per session
- New gameplay questions API (auth, response shape, language resolution)
- New admin CRUD API (email allowlist gate, validation)
- Quiz modal loading + error/retry states
- `quiz_history` records for Grade 2 language subjects (CHECK-constraint fix)
- Blocking property-based tests + CI seed logging
- Existing flows keep working (preschool quizzes, math practices, coins, Grade 2 nav)

---

## Question 1 — Which user flows MUST be covered by an automated browser (E2E) test?

Select all that apply (e.g. `A, C, E`).

A) With UI set to **English**, open the Grade 2 Vietnamese subject → question text is Vietnamese

B) With UI set to **English**, open the Grade 2 English subject → question text is English

C) With UI set to **Vietnamese**, open a Preschool subject (Shapes) → question text is Vietnamese; switch UI to English, reopen → question text is English

D) Switch the UI language **while a Vietnamese-subject quiz is open** → question text does not change

E) Open a content-subject quiz → a loading state appears, then 10 questions render

F) Simulate the questions API failing → the quiz modal shows an error + a Retry button, and no quiz starts

G) Complete a full Grade 2 Vietnamese quiz → results screen + coins awarded (end-to-end incl. history)

H) Math practices (Addition / Times Table) still open and run after the refactor

X) Other (describe after [Answer]: tag)

[Answer]:A,B,C,D,E,G,H

---

## Question 2 — Which error / edge conditions should have automated tests?

Select all that apply.

A) Questions API called **unauthenticated** → 401

B) Questions API for an **unknown subject key** → 404 (or documented error)

C) Questions API **network/500 failure** → quiz modal retry UI (browser test)

D) A subject with **fewer than 10 active questions** → session returns all of them, no crash, no duplicates

E) Admin API called by a **non-allowlisted** signed-in user → 403

F) Admin API **create/update with an invalid payload** (wrong option count, `correct_index` out of range, missing locale for a `localized` subject, bad difficulty) → 400

G) Admin API **unauthenticated** → 401

H) `pickSessionQuestions` with an **empty pool** / `n` larger than the pool → safe result

X) Other (describe after [Answer]: tag)

[Answer]:A,B,C

---

## Question 3 — Which scenarios stay MANUAL (developer checklist after each push)?

Select all that should be a manual check rather than automated.

A) Visual/content review of the ~100 newly authored Grade 2 Vietnamese & English questions (correctness, age-appropriateness, no typos, right answer marked)

B) Confirm `supabase db push` applied the migration to the live project and the two tables + seed rows exist

C) Spot-check on a real mobile device that the loading + error states look right on a small screen

D) Confirm `ADMIN_EMAILS` is set in the deployment environment and a real admin email can hit the admin API while a normal account cannot

E) Confirm the Vercel-deployed app (not just local) shows the Vietnamese subject in Vietnamese with the UI in English

X) Other (describe after [Answer]: tag)

[Answer]:E

---

## Question 4 — Browser / device scope for the automated E2E tests

Your Playwright config currently runs **Chromium + Firefox + WebKit**, desktop viewports.

A) Keep the current scope — Chromium + Firefox + WebKit, desktop *(Recommended — matches existing suite)*

B) Chromium only (faster CI)

C) Current scope **plus** a mobile viewport project for the new quiz-loading/error screens

X) Other (describe after [Answer]: tag)

[Answer]:B

---

## Question 5 — Test data & authentication preconditions

A) **The existing E2E test account is enough** for gameplay tests; the questions API failure test is simulated via route interception (Playwright `page.route`), so no special data needed. Admin API tests run at the API layer (Vitest) against the Zod schema + gate util, so **no live admin account is required in CI**. *(Recommended)*

B) Add a dedicated **admin E2E account** and run admin-API tests through a real browser/live server

C) Gameplay E2E tests need the DB seeded with a **known fixed set** of questions (not the real ~50) so assertions can check exact text

X) Other (describe after [Answer]: tag)

[Answer]:A

---

## Question 6 — Regression boundary: which existing flows must be explicitly re-verified?

Select all that must be re-checked (automated or manual) after this change.

A) Preschool quizzes (Shapes / Colors / Animals) — now DB-backed — still open and score correctly

B) Grade 1 & Grade 2 **Math** practices (Addition, Subtraction, Times Table) — still generate and run

C) Coin reward on quiz completion — still awarded and the balance updates

D) Quiz history is still recorded for all quiz types

E) Grade 2 subject navigation (`grade2-subjects.spec.ts` — subject cards, Math drill-down, difficulty badge) still passes

F) UI language switch still translates menus, buttons, titles, difficulty badge (just not `fixed`-subject questions)

X) Other (describe after [Answer]: tag)

[Answer]:A,B,C,D,E

---

## Question 7 — Anything else for the test plan

Any specific scenario, data condition, or concern you want explicitly covered or explicitly left out?

[Answer]:No
