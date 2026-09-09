# Test Case Design — Clarification — subject-content-db

A few of your answers pull against each other or against earlier decisions. Please resolve
these, then say "done".

---

## Clarification 1 — The API-failure / Retry browser test

- Q1 (browser tests) — you **did not** pick **F** ("simulate the questions API failing →
  quiz modal shows error + Retry, no quiz starts").
- Q2 (error tests) — you **did** pick **C** ("Questions API network/500 failure → quiz
  modal retry UI (**browser test**)").

These describe the same test. Which is it?

A) **Include it** as a browser (E2E) test — Playwright intercepts the questions request and
   forces a failure, asserts the Retry UI shows and no quiz begins *(this is what Q2=C says)*

B) **Cover it only as a component/unit test** of the quiz modal (render with an error prop),
   no browser test

C) Drop it entirely

[Answer]:A

---

## Clarification 2 — Automated tests for the admin CRUD API

- Requirements Q11 = D → "unit + **API** + E2E".
- Q5 = A → "Admin API tests run at the **API layer (Vitest)** against the Zod schema + gate
  util … no live admin account required in CI".
- But Q2 (error tests) left **E** (non-allowlisted → 403), **F** (invalid payload → 400),
  and **G** (unauthenticated → 401) **unchecked**.

What level of automated coverage should the admin API (`/api/admin/subjects`,
`/api/admin/subject-questions`) get?

A) **API-layer contract tests (Vitest)**: the email-allowlist gate util (allowlisted →
   pass, non-allowlisted → 403, unauthenticated → 401) **and** the Zod write schema
   (valid create/update passes; wrong option count / `correct_index` out of range / missing
   locale for a `localized` subject / bad difficulty → 400). No browser test. *(Recommended
   — matches Q5=A and requirements Q11=D)*

B) **Happy-path only** — one test that a valid admin create/update payload passes
   validation; skip the gate and rejection tests

C) **No automated tests** for the admin API this initiative — rely on manual checks

[Answer]:C

---

## Clarification 3 — Manual checklist scope

Q3 selected only **E** (verify on the deployed Vercel app). It left unchecked:

- **A** — content review of the ~100 newly authored Grade 2 Vietnamese & English questions
- **B** — confirm `supabase db push` applied the migration (you run this yourself, Q7=A)
- **D** — confirm `ADMIN_EMAILS` is set in the deploy env and admin access actually works

A) **Add A, B, and D** to the manual checklist alongside E *(Recommended — these are
   things only you can verify and each is a real release risk)*

B) **Add only A and B** (content review + migration applied); drop D

C) **Keep only E** — you're comfortable there is no manual checklist item for content
   accuracy, migration application, or admin-env setup

D) Other (describe after [Answer]: tag)

[Answer]:A

---

## Clarification 4 — Browser scope (Q4 = B, "Chromium only")

This differs from the existing suite (Chromium + Firefox + WebKit). How should it apply?

A) **New E2E specs for this initiative run Chromium-only**, but leave the existing
   `playwright.config.ts` (3 browsers) and the current specs untouched — the CI e2e job
   invocation is narrowed to `--project=chromium` *(Recommended)*

B) **Change `playwright.config.ts` to Chromium-only** for the whole suite (existing specs
   included) — fewer CI minutes, less cross-browser safety

C) Other (describe after [Answer]: tag)

[Answer]:B

---

## Note (no answer needed)

`pickSessionQuestions` edge cases (empty pool, `n` > pool size — e.g. Grade 1 Vietnamese
has only ~3 questions) and the session-selection invariants will be covered by the
**blocking property-based tests** (PBT extension), plus example-based tests, regardless of
the Q2 selections. Grade 1 Vietnamese's small bank is therefore exercised.
