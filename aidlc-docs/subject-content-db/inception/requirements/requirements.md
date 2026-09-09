# Requirements — subject-content-db

**Status**: Awaiting user approval
**Last updated**: 2026-09-09

---

## 1. Intent Analysis

| Field | Value |
|---|---|
| **User request** | Fix the bug where the Vietnamese subject renders in English when the UI language is English; move the hardcoded Vietnamese/English (and other static) subject quiz content out of the code into the Supabase database; add an API to serve it; expand the Grade 2 Vietnamese and English question banks. |
| **Request type** | Enhancement + Migration + Bug Fix (combined) |
| **Scope estimate** | Multiple components — DB schema, service layer, new API routes, `data/translations.ts`, `components/learning-zone.tsx`, `components/quiz-modal.tsx`, `lib/database.types.ts`, `lib/validation/api.ts`, tests, content authoring |
| **Complexity estimate** | Moderate–Complex |
| **Project type** | Brownfield (Next.js 16 + Supabase monolith) |

---

## 2. Background (from Reverse Engineering)

- All quiz content lives in `data/translations.ts` as `{ vi, en }` pairs and is re-assembled
  inline in `components/learning-zone.tsx`. The per-question `correctIndex` is a magic
  literal in the component, decoupled from the option text.
- `t(section, key)` resolves text with the **UI locale**. Because subject-learning content
  is resolved the same way as UI chrome, the Vietnamese subject shows English text when the
  UI is English — the reported bug.
- The `stickers` table + `supabase/seed.sql` + `GET /api/stickers` + `lib/services/stickers.ts`
  is the established "reference data in the DB, served via an authenticated API route" pattern.
- The `quiz_history.category` DB `CHECK` constraint omits `grade2Vietnamese` / `grade2English`
  (added to TS + Zod but never migrated) — those history inserts fail silently server-side.

---

## 3. Decisions from Clarification (Rounds 1 & 2)

| Ref | Decision |
|---|---|
| Q1=C | **All static quiz content** moves to the DB: Preschool (Shapes, Colors, Animals), Grade 1 Vietnamese, Grade 1 English, Grade 2 Vietnamese, Grade 2 English. The runtime math generators (`math`, `addition`, `subtraction`, `timesTable`) stay in code and are **out of scope**. |
| Q2=B | Normalized schema: a **`subjects`** table and a **`subject_questions`** table. |
| Q3=A / C1=A | Each subject has a **`content_mode`**: `fixed` (stored once in the subject's target language, never locale-switched) or `localized` (stores `vi` + `en`, picked by UI locale). Vietnamese & English subjects = `fixed`; Preschool subjects = `localized`. |
| Q4=A / C5=A | The English subjects are **fully English** (prompt + options). Grade 1 English is **re-authored** — its current Vietnamese answer options are rewritten to English (question count unchanged at ~10). |
| Q5=A | Grade 1 and Grade 2 keep **separate question banks** per subject, addressed by their existing category ids. |
| Q6=B / C2=C | Content volume: **Grade 2 Vietnamese → ~50** questions, **Grade 2 English → ~50** questions (new content authored). Grade 1 Vietnamese (~3), Grade 1 English (~10), Preschool banks (~10 each) migrate at their **current size**. **10 questions shown per session** for every subject. |
| Q7=A | The migration is committed to the repo; **the user runs `supabase db push`** against the linked project (`eoelyqphaixgqlkyoxau`). CI does not run migrations. |
| Q8=B / C3=A / C4=A | Add an **admin CRUD API** for questions, gated by an **`ADMIN_EMAILS`** env-var allowlist (comma-separated). No admin UI. |
| Q9=A | If the questions API fails, the quiz modal shows a **friendly error with a Retry button**. No bundled content fallback. |
| Q10=A | The migration **also fixes** the `quiz_history.category` CHECK constraint to include `grade2Vietnamese` / `grade2English`. |
| Q11=D | Tests: **unit + API + E2E**, plus update the existing `automation_tests/e2e/grade2-subjects.spec.ts` for async question loading. |
| Q12=B | Security Baseline extension: **not enabled**. |
| Q13=B | Resiliency Baseline extension: **not enabled**. |
| Q14=A | Property-Based Testing extension: **enabled (full, blocking)**. |

---

## 4. Functional Requirements

### FR-1 — Subject content in the database
- **FR-1.1** A `subjects` table stores one row per content-backed subject, with: a stable
  `key` matching the app's existing category id (`shapes`, `colors`, `animals`,
  `vietnamese`, `english`, `grade2Vietnamese`, `grade2English`), display name(s), grade
  band, target language, `content_mode` (`fixed` | `localized`), and questions-per-session
  (10).
- **FR-1.2** A `subject_questions` table stores each question: FK to subject, difficulty
  (`easy` | `medium` | `hard`, nullable), a stable `correct_index`, an `is_active` flag, a
  `sort_order`, and localized text — Vietnamese and English prompt + options such that a
  `fixed` subject populates only its target language and a `localized` subject populates
  both. Options are stored as an ordered array; `correct_index` refers to that order and is
  the same across locales.
- **FR-1.3** The runtime math practices (`math`, `addition`, `subtraction`, `timesTable`)
  are **not** represented in these tables and keep generating questions in code.
- **FR-1.4** The tables are read-restricted to authenticated users via RLS (matching the
  `stickers` catalog policy). Writes happen only via SQL migration/seed or the admin API
  (service-role / gated route).

### FR-2 — Content migration & authoring
- **FR-2.1** Every question currently in `data/translations.ts` for the in-scope subjects
  is migrated into `subject_questions` with its existing correct answer preserved (the
  `correctIndex` literals from `components/learning-zone.tsx` are the source of truth for
  the correct answers during migration).
- **FR-2.2** Grade 2 Vietnamese is expanded to ~50 total active questions (Vietnamese only).
- **FR-2.3** Grade 2 English is expanded to ~50 total active questions (English only).
- **FR-2.4** Grade 1 English questions are re-authored so both prompt and options are in
  English; count stays ~10.
- **FR-2.5** New content targets Vietnamese primary-school Grade 1–2 level: age-appropriate
  vocabulary, grammar, reading, and general-knowledge items; each question has exactly 3
  options with one correct; each is tagged with a difficulty.
- **FR-2.6** Seed data is delivered as a Supabase migration file (idempotent — safe to
  re-run) committed to `supabase/migrations/`.

### FR-3 — Gameplay content API
- **FR-3.1** A new authenticated endpoint returns the question set for a subject by `key`,
  accepting the caller's UI `locale`. Response shape matches what `QuizModal` consumes:
  `{ title, questions: [{ id, question, options, correctIndex, difficulty }] }`.
- **FR-3.2** Language resolution is server-side:
  - `content_mode = fixed` → always the subject's target-language text, **ignoring** the
    `locale` parameter (this is the bug fix).
  - `content_mode = localized` → the text for the requested `locale`.
- **FR-3.3** The endpoint returns all **active** questions for the subject. Session
  selection (pick 10, randomize order) is done by a pure, unit- & property-tested client
  utility so it can be tested without a database.
- **FR-3.4** The endpoint returns `401` when unauthenticated and a clear error body on
  failure. It never returns partially-resolved or empty question text for an active
  question.

### FR-4 — Frontend integration
- **FR-4.1** `components/learning-zone.tsx` loads content-subject questions from the API
  (async), while math practices keep using their in-code generators. The `quizData`
  structure becomes hybrid (async-loaded vs generated).
- **FR-4.2** Opening a content-subject quiz triggers a fetch; the modal shows a loading
  state while questions load.
- **FR-4.3** On fetch failure, the quiz modal shows a friendly message and a **Retry**
  button (Q9). No quiz starts with fallback/bundled questions.
- **FR-4.4** Subject/quiz **titles** come from the `subjects` table (or remain UI chrome —
  finalized in Application Design); question and option **text** no longer comes from
  `data/translations.ts`. Migrated question/option keys are removed from `translations.ts`;
  UI-chrome keys (`categories`, `quiz.*` labels, buttons) stay.
- **FR-4.5** Switching the UI language while a `fixed`-subject quiz is open (or reopening
  it) must **not** change the question/answer text. UI chrome (buttons, progress, difficulty
  badge, results screen) still localizes.

### FR-5 — Admin content API
- **FR-5.1** Admin endpoints provide full CRUD over `subject_questions` (list, create,
  update, deactivate) and list access to `subjects`.
- **FR-5.2** Access is gated: the request must be authenticated **and** the user's email
  must appear in the `ADMIN_EMAILS` env var (comma-separated, case-insensitive). Otherwise
  `403`.
- **FR-5.3** Write payloads are validated (Zod): valid subject reference, 3 options, a
  `correct_index` within range, valid difficulty, and — for `localized` subjects — both
  locales present; for `fixed` subjects, the target locale present.
- **FR-5.4** `ADMIN_EMAILS` is documented in `.env.local.example`.

### FR-6 — `quiz_history` constraint fix
- **FR-6.1** The migration updates the `quiz_history.category` CHECK constraint to also
  allow `grade2Vietnamese` and `grade2English`, so quiz-completion history for the Grade 2
  language subjects records successfully.

---

## 5. Non-Functional Requirements

- **NFR-1 (Compatibility)** Existing quizzes (preschool via new API, math via generators),
  the coin-reward flow, quiz history, and the Grade 2 subject navigation continue to work
  unchanged from the user's perspective.
- **NFR-2 (Performance)** A subject's question set is small (≤ ~50 rows); a single indexed
  query per quiz open is acceptable. No pagination needed. Client may cache a fetched
  subject for the session.
- **NFR-3 (Data integrity)** An active question always has complete text for the locale(s)
  its subject requires and a `correct_index` within its options range — enforced by
  validation on write and verified by tests.
- **NFR-4 (Security)** Content tables follow the existing RLS model (authenticated read
  only). Admin writes require the email allowlist. Service-role key stays server-only.
  No new secrets in client bundles.
- **NFR-5 (Testability / PBT)** Property-based tests (fast-check, already a dependency)
  are **blocking** and cover: the options-array ↔ DTO round-trip (PBT-02), session-selection
  invariants (PBT-03: length = min(n, pool); subset; no duplicates; every `correctIndex`
  in range), and language-resolution invariants (PBT-03: a `fixed` subject's output text
  is independent of the `locale` input). Example-based tests pin key scenarios (PBT-10).
  CI logs the fast-check seed (PBT-08).
- **NFR-6 (Maintainability)** Content is managed via committed SQL migrations plus the
  admin API; no duplicated bilingual strings for `fixed` subjects.
- **NFR-7 (Coverage)** Vitest line coverage stays ≥ 80% for `lib/services/**`,
  `app/api/**`, `components/**` (existing threshold).
- **NFR-8 (Deployment)** Schema changes ship as one idempotent migration file; the user
  applies it with `supabase db push`. The frontend must tolerate the API being deployed
  before the migration is applied only insofar as it shows the FR-4.3 error (no crash).

---

## 6. Personas

| Persona | Need |
|---|---|
| **Student (child)** | Practise a subject in the correct language; a Vietnamese lesson stays in Vietnamese even if a parent set the app to English. |
| **Parent / UI user** | Switch the app UI language for menus and instructions without corrupting the child's language lessons. |
| **Content admin (you)** | Add/adjust questions for the Vietnamese and English subjects without a code deploy. |

---

## 7. Out of Scope

- Runtime math practices (`math`, `addition`, `subtraction`, `timesTable`) — stay in code.
- An admin **UI** — API only.
- Localizing the English subject into Vietnamese (or vice-versa) — `fixed` subjects are
  single-language by decision.
- Per-user adaptive difficulty, spaced repetition, question analytics.
- Migrating preschool content volume (kept at current size).
- CI applying migrations automatically.

---

## 8. Assumptions

- **A-1** `fast-check` (present, `^3.22.0`) is the PBT framework (PBT-09 satisfied).
- **A-2** The linked Supabase project is writable by the user via the Supabase CLI.
- **A-3** Each question has exactly 3 options (matches all current content and the
  `QuizModal` layout).
- **A-4** `correct_index` is shared across locales because the option **order** is kept
  identical between the `vi` and `en` arrays of a `localized` question.
- **A-5** "~50" means 45–55 active questions; the reviewer may trim during content review.
- **A-6** The CI `INITIATIVE` env var (currently `grade2-subjects-coin-rewards`) will be
  updated to `subject-content-db` (or the report path decision confirmed) during Build & Test.

---

## 9. Acceptance Criteria (observable)

- **AC-1** With the UI set to **English**, opening the Grade 2 Vietnamese subject shows
  questions and options **in Vietnamese**. (E2E)
- **AC-2** With the UI set to **Vietnamese**, opening a Preschool subject (e.g. Shapes)
  still shows questions in Vietnamese; with the UI in English they show in English. (E2E/unit)
- **AC-3** The Grade 2 Vietnamese and Grade 2 English subjects each have ≥ 45 active
  questions in the database; a session shows 10. (DB / API test)
- **AC-4** `data/translations.ts` no longer contains question/option text for the migrated
  subjects; the app builds and all existing tests pass. (build)
- **AC-5** `GET` questions endpoint: returns `401` unauthenticated; returns the documented
  shape authenticated; a `fixed` subject's text is identical for `?locale=vi` and
  `?locale=en`. (API test + PBT)
- **AC-6** Admin endpoints: `403` for a non-allowlisted user; `2xx` and a persisted change
  for an allowlisted user; invalid payloads rejected `400`. (API test)
- **AC-7** A completed Grade 2 Vietnamese quiz records a `quiz_history` row without a
  constraint error. (API/integration)
- **AC-8** If the questions endpoint returns an error, the quiz modal shows the retry UI
  and no quiz begins. (E2E/unit)
- **AC-9** PBT suite passes and is wired into CI with seed logging; no blocking PBT finding.

---

## 10. Key Risks

| Risk | Level | Mitigation |
|---|---|---|
| Frontend deployed before migration applied → API 500s | Medium | FR-4.3 retry UI; migration is a documented pre-deploy step (Q7) |
| Content authoring volume (~2×50 questions) drifts in quality | Medium | Reviewer approves content; A-5 tolerance; difficulty tagging guidance in Functional Design |
| Two-table schema vs `fixed`/`localized` needs a 3rd table or nullable columns | Low | Finalized in Application Design; requirements allow either as long as FR-1.2 holds |
| Coverage dips below 80% due to new async paths in `learning-zone.tsx` | Medium | New service + util fully unit-tested; component tests for loading/error states |
| Full (blocking) PBT on a thin data layer over-constrains | Low | Properties scoped to selection logic + serialization + language resolution (NFR-5) |
