# Test Case Design — subject-content-db

**Status**: Approved (user, 2026-09-09)
**Last updated**: 2026-09-09

Numbering continues from the prior initiative: existing E2E cases end at TC-E008, existing
API cases end at TC-A024. New cases start at TC-E009 / TC-A025 / TC-M001.

---

## Coverage Summary

| Type | Count | Source |
|---|---|---|
| Automated E2E (TC-E) | 8 | Playwright (Chromium only — CL4=B) |
| Automated API / unit-contract (TC-A) | 6 | Vitest (no live server) |
| Property-based (PBT) | 3 property groups | fast-check (blocking) |
| Manual Verification (TC-M) | 5 | Developer checklist |
| **Total explicit cases** | **19** + PBT | |

### Scope decisions carried from QA answers
- **Admin CRUD API gets NO automated route tests** (CL2=C). It is verified by **TC-M003**
  (manual). The pure `isAdminEmail()` helper still gets a small unit test (it is pure logic,
  not "admin API test infrastructure") — see "Unit / helper tests". `app/api/admin/**` will
  be **excluded from the Vitest coverage `include` globs** so the untested thin route
  wrappers do not break the 80% line threshold. *(Flag this interpretation at approval if
  you'd rather the coverage exclusion not happen.)*
- E2E runs **Chromium only** — `playwright.config.ts` `projects` reduced to `chromium` for
  the whole suite (CL4=B).
- No live admin account in CI; the API-failure E2E uses Playwright route interception
  (CL1=A, Q5=A).

---

## Automated E2E Test Cases (TC-E)

Generated as Playwright specs in `automation_tests/e2e/`. Grouped into a new
`subject-content.spec.ts`; the existing `grade2-subjects.spec.ts` is **modified** (not
replaced) to tolerate the new async loading state.

**Common preconditions**: logged in via the existing E2E account
(`E2E_USERNAME`/`E2E_PASSWORD`); on the Learning Zone. Helper `openSubjectQuiz(page, tab, testid)`.

---

### TC-E009 | With the UI in English, the Grade 2 Vietnamese subject shows Vietnamese question text

**Preconditions**: Logged in; Learning Zone open.
**Browser scope**: Chromium.
**Steps**:
1. Set UI language to English (`getByTestId('lang-en').click()`).
2. Open the Grade 2 tab, click `grade2-subject-vietnamese`.
3. Wait for `quiz-question` to be visible (past the loading state).
**Expected result**: The question text and all option texts are Vietnamese.
**Assertions**:
- `quiz-question` text matches a Vietnamese-diacritic pattern (`/[àáảãạăâđêôơư…]/i`) OR equals one of the known seeded Vietnamese prompts.
- No option text is an English-only ASCII word list that matches the English variant.
- `quiz-modal` visible; `lang-en` shows active state (UI chrome is English — e.g. `quiz-next-button` / progress text in English).
**data-testid(s) needed**: `quiz-loading` (new), `quiz-question` (exists), `quiz-option-0..2` (exist), `lang-en`/`lang-vi` (exist), `grade2-subject-vietnamese` (exists).

---

### TC-E010 | With the UI in English, the Grade 2 English subject shows English question text

**Preconditions**: Logged in; Learning Zone open.
**Browser scope**: Chromium.
**Steps**:
1. Set UI language to English.
2. Grade 2 tab → click `grade2-subject-english`.
3. Wait for `quiz-question`.
**Expected result**: Question + options are English.
**Assertions**: `quiz-question` text is ASCII/English; matches one of the seeded English prompts; no Vietnamese diacritics in options.
**data-testid(s) needed**: `grade2-subject-english` (exists), `quiz-loading` (new).

---

### TC-E011 | Preschool subject follows the UI language (localized subject)

**Preconditions**: Logged in; Learning Zone open; Preschool tab.
**Browser scope**: Chromium.
**Steps**:
1. Set UI language to Vietnamese.
2. Open the Shapes quiz (`quiz-shapes`).
3. Record the `quiz-question` text; close the modal.
4. Set UI language to English.
5. Reopen the Shapes quiz.
**Expected result**: Step 3 text is Vietnamese; step 5 text is English (different string, same question meaning).
**Assertions**: The two recorded `quiz-question` strings differ; step-3 matches Vietnamese pattern, step-5 matches English pattern.
**data-testid(s) needed**: `quiz-shapes` (exists), `quiz-loading` (new), `quiz-close` (exists).

---

### TC-E012 | Switching UI language while a fixed-subject quiz is open does not change the question text

**Preconditions**: Logged in; Learning Zone; UI = Vietnamese.
**Browser scope**: Chromium.
**Steps**:
1. Open Grade 2 Vietnamese subject; wait for `quiz-question`; record its text.
2. Without closing the modal, click `lang-en`.
3. Re-read `quiz-question`.
**Expected result**: The question text is unchanged (still Vietnamese). UI chrome (e.g. difficulty badge label, next button) switches to English.
**Assertions**: recorded text in step 1 === text in step 3; `quiz-difficulty-badge` label is now an English label (`Easy|Medium|Hard`).
**data-testid(s) needed**: `quiz-difficulty-badge` (exists).

---

### TC-E013 | Opening a content-subject quiz shows a loading state, then 10 questions

**Preconditions**: Logged in; Learning Zone.
**Browser scope**: Chromium.
**Steps**:
1. Open the Grade 2 English subject.
2. Assert `quiz-loading` appears.
3. Wait for it to disappear and `quiz-question` to show.
4. Read `quiz-progress-text`.
**Expected result**: Loading indicator shows briefly; then a question; progress shows `1/10`.
**Assertions**: `quiz-loading` visible then hidden; `quiz-progress-text` === `1/10`.
**data-testid(s) needed**: `quiz-loading` (new), `quiz-progress-text` (exists).

---

### TC-E014 | Questions API failure shows an error + Retry, and no quiz starts

**Preconditions**: Logged in; Learning Zone. Playwright route interception on the questions endpoint returning HTTP 500.
**Browser scope**: Chromium.
**Steps**:
1. `page.route('**/api/subjects/**', route => route.fulfill({ status: 500, body: '{"data":null,"error":"boom"}' }))`.
2. Open the Grade 2 Vietnamese subject.
3. Wait for `quiz-error`.
4. Remove the route override; click `quiz-retry-button`.
**Expected result**: An error message with a Retry button appears; `quiz-question` is NOT rendered; after Retry (with the route restored) the quiz loads normally.
**Assertions**: `quiz-error` visible; `quiz-question` not visible; `quiz-retry-button` visible; after retry `quiz-question` visible.
**data-testid(s) needed**: `quiz-error` (new), `quiz-retry-button` (new).

---

### TC-E015 | Completing a full Grade 2 Vietnamese quiz shows results and awards coins

**Preconditions**: Logged in; Learning Zone; note starting coin balance from `coin-display`.
**Browser scope**: Chromium.
**Steps**:
1. Open the Grade 2 Vietnamese subject; wait for the first question.
2. Answer all 10 questions (click an option, then `quiz-next-button`, repeat).
3. On the results screen, click `quiz-claim-coins`.
**Expected result**: `quiz-results` screen shows a score `x/10`; after claiming, the coin balance in `coin-display` is ≥ the starting balance (difficulty-based reward is 5–30).
**Assertions**: `quiz-results` visible; `quiz-score` contains `/10`; post-claim `coin-display` numeric value > starting value.
**data-testid(s) needed**: `coin-display` value testid (verify exists; add `coin-display-amount` if missing), `quiz-results`, `quiz-score`, `quiz-claim-coins` (exist).

---

### TC-E016 | Math practice still opens and runs after the refactor (regression — Q6-B)

**Preconditions**: Logged in; Learning Zone; Grade 2 tab → Math drill-down.
**Browser scope**: Chromium.
**Steps**:
1. Click `grade2-subject-math`, then `grade2-practice-addition`.
2. Wait for `quiz-question`; answer the first question; click `quiz-next-button`.
**Expected result**: The Addition quiz opens **without** a loading spinner (generated in-code, synchronous), a question of the form `a + b = ?` renders, answering advances.
**Assertions**: `quiz-question` matches `/\d+\s*\+\s*\d+/`; `quiz-loading` never appeared; progress advances to `2/10`.
**data-testid(s) needed**: none new.

---

### TC-E017 | Preschool quiz still opens and scores after migration to the DB (regression — Q6-A)

**Preconditions**: Logged in; Learning Zone; Preschool tab; UI = Vietnamese.
**Browser scope**: Chromium.
**Steps**:
1. Open the Colors quiz; wait for `quiz-question`.
2. Select the correct option (known from seed) ; assert feedback; advance.
**Expected result**: Question renders in Vietnamese; selecting the correct answer shows the "correct" feedback; `quiz-next-button` advances.
**Assertions**: `quiz-feedback-text` shows the correct-answer message; progress advances.
**data-testid(s) needed**: none new.

---

### Modified existing spec — `grade2-subjects.spec.ts`

TC-E001..TC-E007 keep their IDs and intent. Changes:
- Any step that clicks `grade2-subject-vietnamese` / `grade2-subject-english` and then
  asserts on the quiz must first `await page.getByTestId('quiz-loading').waitFor({ state: 'hidden' })`
  (or wait for `quiz-question`) before asserting — the quiz is now async.
- TC-E006 (difficulty badge on the first Addition question) is unaffected (math is still synchronous).

---

## Automated API / Unit-Contract Test Cases (TC-A)

Generated in `automation_tests/api/subject-questions.api.test.ts`. These import the route
handler / service / Zod schema directly — **no live server** (matches
`quiz-history.api.test.ts`).

---

### TC-A025 | GET questions endpoint — unauthenticated → 401

Call the route handler with a request whose Supabase `auth.getUser()` returns no user
(mocked). Expect the `apiError('Not authenticated', 401)` shape (`{ data: null, error }`, status 401).

### TC-A026 | GET questions endpoint — unknown subject key → 404

Authenticated request for `key = 'grade9Wizardry'`. Expect a 404 (or the project's
documented not-found error shape) and `data: null`.

### TC-A027 | GET questions endpoint — valid subject, authenticated → documented shape

Authenticated request for `key = 'grade2English'` with a mocked service returning a known
set. Expect `{ data: { title: string, questions: [{ id, question, options, correctIndex, difficulty }] } }`,
every `options` array length 3, every `correctIndex` in `0..2`, `difficulty` ∈ `easy|medium|hard|null`.

### TC-A028 | GET questions for a fixed subject — text is locale-independent (bug-fix contract)

Call the **language-resolution function** (pure, from the service) for a `fixed` subject
(`grade2Vietnamese`) twice — once resolving for `locale='vi'`, once for `locale='en'`.
Expect identical `question` and `options` output both times (always the Vietnamese text).

### TC-A029 | GET questions for a localized subject — text follows the locale

Call the resolution function for a `localized` subject (`shapes`): `locale='vi'` yields the
`vi` text, `locale='en'` yields the `en` text; `correctIndex` identical across both.

### TC-A030 | Migration — `quiz_history.category` CHECK includes the Grade 2 language categories

Static assertion: read `supabase/migrations/<new>.sql` and assert the file adds
`grade2Vietnamese` and `grade2English` to the `quiz_history.category` CHECK constraint.
(Full DB-level verification is manual — **TC-M005**.)

---

## Unit / helper tests (Vitest — not TC-numbered, listed for Code Generation)

| Target | Cases |
|---|---|
| `pickSessionQuestions(pool, n, rng?)` | returns `min(n, pool.length)` items; all items ∈ pool; no duplicates; empty pool → `[]`; `n > pool.length` → whole pool shuffled; `n = 0` → `[]` |
| language resolution (`resolveQuestion` / service mapper) | fixed subject → target-language text for any `locale`; localized subject → per-`locale` text; `correctIndex` preserved; missing target text for an active question throws / is filtered |
| `isAdminEmail(email, allowlistCsv)` (pure helper) | allowlisted → true; not listed → false; empty/undefined env → false; case-insensitive; trims whitespace around entries |
| DB-row → API-DTO mapper | `options` JSONB array ↔ `string[]` round-trips; difficulty passthrough |

---

## Property-Based Test Cases (PBT — fast-check, BLOCKING)

Generated in `automation_tests/unit/subject-content.pbt.test.ts`. Seed logged in CI (PBT-08).

| ID | Category | Property |
|---|---|---|
| PBT-A | Invariant (PBT-03) | For any generated `pool` (array of question objects with 3 options + valid `correctIndex`) and any `n ≥ 0`: `pickSessionQuestions(pool, n)` length `= min(n, pool.length)`, output is a subset of `pool` with no duplicate ids, and every output item's `correctIndex` is a valid index into its `options`. |
| PBT-B | Invariant (PBT-03) | For any generated subject with `content_mode='fixed'` and target language `L`, and any `locale ∈ {vi,en}`: `resolveQuestion(q, subject, locale).question` equals the `L` text — i.e. output is independent of `locale`. For `content_mode='localized'`: output text equals the requested `locale`'s text. |
| PBT-C | Round-trip (PBT-02) | For any generated question row, `rowToDto(row)` then `dtoToWritePayload(dto)` preserves prompt text, option array (order + values), `correct_index`, and difficulty (`f_inv(f(x)) = x`). |

Generators: a domain `questionArb` (3 non-empty option strings, `correctIndex` in `0..2`,
difficulty from the enum, id) and a `subjectArb` (`content_mode`, `target_language`,
localized/fixed text sets) — defined as reusable utilities (PBT-07). Example-based tests in
the unit files pin the concrete seeded scenarios (PBT-10).

---

## Manual Verification Test Cases (TC-M)

Written to `MANUAL-TEST-CHECKLIST.md` at the repo root. The developer works through these
after every push to main before closing the deploy.

---

### TC-M001 | Content review of the newly authored Grade 2 Vietnamese & English questions

**When to verify**: Before merging the content migration PR.
**Preconditions**: The migration SQL (or a rendered list) of the ~50 Grade 2 Vietnamese and
~50 Grade 2 English questions.
**Steps**:
1. Read every new question and its 3 options.
2. For each, confirm the marked `correct_index` is actually correct.
3. Confirm language purity — Vietnamese questions fully Vietnamese (with correct diacritics),
   English questions fully English.
4. Confirm age-appropriateness for Grade 1–2 (~6–8 yrs) and no duplicates/near-duplicates.
5. Sanity-check the difficulty tag on each.
**Expected result**: Every question is correct, correctly keyed, in the right language,
grade-appropriate, unique.
**What to specifically check**: any question where two options could both be defensible;
any Vietnamese text missing tone marks; any English question that accidentally includes a
Vietnamese word.

---

### TC-M002 | Migration applied to the live Supabase project

**When to verify**: Immediately after running `supabase db push`, before the frontend deploy is marked done.
**Preconditions**: Supabase CLI linked to `eoelyqphaixgqlkyoxau`.
**Steps**:
1. Run `supabase db push` (or `supabase migration up`).
2. In the Supabase dashboard SQL editor: `select count(*) from subjects;` and `select subject_id, count(*) from subject_questions group by 1;`
3. `select pg_get_constraintdef(oid) from pg_constraint where conname like '%quiz_history_category%';`
**Expected result**: `subjects` has one row per content-backed subject; `subject_questions`
counts match the seed (~50 for each Grade 2 language subject, ~10 preschool, ~3 Grade 1 VN,
~10 Grade 1 EN); the `quiz_history` category CHECK now lists `grade2Vietnamese` and `grade2English`.
**What to specifically check**: the exact row counts per subject; that no subject has 0 questions.

---

### TC-M003 | Admin API — allowlist gate works on the deployed environment

**When to verify**: After deploy, once `ADMIN_EMAILS` is set in the hosting env.
**Preconditions**: `ADMIN_EMAILS` contains your admin email; you have one allowlisted login and one ordinary login.
**Steps**:
1. Signed in as the **allowlisted** user: `GET /api/admin/subjects` → expect `200` + the subject list.
2. `POST /api/admin/subject-questions` with a valid new question → expect `2xx`; re-fetch and see it.
3. `PATCH` that question (e.g. deactivate) → expect `2xx`; confirm it no longer appears in a gameplay session.
4. Send an invalid payload (2 options) → expect `400`.
5. Signed in as the **ordinary** user: `GET /api/admin/subjects` → expect `403`.
6. With no auth cookie: → expect `401`.
**Expected result**: All six outcomes as stated.
**What to specifically check**: step 5 returns 403 (not 200, not 500); step 2's new row is
actually served to the gameplay endpoint.

---

### TC-M004 | Deployed app — Vietnamese subject renders in Vietnamese with UI in English

**When to verify**: After the frontend deploy + migration.
**Preconditions**: Production URL, a test login.
**Steps**:
1. Open the deployed app, log in, go to Learning Zone.
2. Switch UI language to English (menus/buttons become English).
3. Grade 2 tab → open the Vietnamese subject.
4. Read 3–4 questions (use "Next").
**Expected result**: Every question and option is in Vietnamese; the surrounding UI
(progress, difficulty badge, buttons) is in English.
**What to specifically check**: no question shows the old English translation
("Which word names a color?" etc.); the loading state is brief and not stuck.

---

### TC-M005 | Deployed app — quiz history + coins recorded for all quiz types (regression — Q6-C/D)

**When to verify**: After deploy.
**Preconditions**: Production URL, a test login, note the starting coin balance.
**Steps**:
1. Complete one quiz of each kind: a Preschool subject, a Math practice, Grade 2 Vietnamese, Grade 2 English.
2. After each, note the coin balance.
3. Check `GET /api/quiz/history` (or the history UI) for the four new rows.
**Expected result**: Coin balance increases after each; `quiz_history` has a row for each
of the four categories, including `grade2Vietnamese` and `grade2English` (no silent
constraint failure).
**What to specifically check**: the `grade2Vietnamese` / `grade2English` history rows
exist — this is the constraint-fix verification.

---

## Regression Guard

| Flow | Type | How to verify |
|---|---|---|
| Preschool quizzes (Shapes/Colors/Animals) — now DB-backed | Automated + Manual | TC-E011, TC-E017; TC-M002 row counts |
| Grade 1 & 2 Math practices (still generated) | Automated | TC-E016; modified `grade2-subjects.spec.ts` TC-E006 |
| Coin reward on completion | Automated + Manual | TC-E015; TC-M005 |
| Quiz history recorded (all types) | Manual | TC-M005 |
| Grade 2 subject navigation | Automated | modified `grade2-subjects.spec.ts` TC-E001..E005 |
| UI language switch translates chrome | Automated (incidental) | asserted as a side-check in TC-E009/E012 |

---

## data-testid Attribute Requirements

Code Generation MUST add these to the generated / modified components.

| Attribute | Element | Component | Used by |
|---|---|---|---|
| `quiz-loading` | Loading spinner/skeleton container shown while questions fetch | `quiz-modal.tsx` (or a wrapper) | TC-E009–E013, E017, modified grade2-subjects.spec |
| `quiz-error` | Error message container shown on fetch failure | `quiz-modal.tsx` | TC-E014 |
| `quiz-retry-button` | "Try again" button in the error state | `quiz-modal.tsx` | TC-E014 |
| `coin-display-amount` | The numeric coin value (only if not already individually selectable) | `coin-display.tsx` | TC-E015 |

Existing testids reused (no change): `quiz-modal`, `quiz-question`, `quiz-option-0..2`,
`quiz-progress-text`, `quiz-difficulty-badge`, `quiz-results`, `quiz-score`,
`quiz-claim-coins`, `quiz-next-button`, `quiz-feedback-text`, `quiz-close`,
`lang-vi`, `lang-en`, `tab-grade2`, `tab-preschool`, `grade2-subject-vietnamese`,
`grade2-subject-english`, `grade2-subject-math`, `grade2-practice-addition`,
`quiz-shapes`, `quiz-colors`.
