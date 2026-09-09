# Requirements Clarification Questions — subject-content-db

Please answer each question by filling in the letter after the `[Answer]:` tag.
If none of the options fit, choose the last option (**Other**) and describe your choice.
Let me know when you're done and I'll build the requirements document.

Context recap (from Reverse Engineering):
- All quiz content is hardcoded in `data/translations.ts` and assembled inline in `components/learning-zone.tsx`.
- The Vietnamese subject renders in English when the UI language is English, because question text is resolved with the UI locale.
- Grade 1 Vietnamese has 3 questions; Grade 2 Vietnamese and English have 15 each.
- The `stickers` table + `GET /api/stickers` + `lib/services/stickers.ts` is the existing "reference data in DB, served via API" pattern to mirror.

---

## Question 1 — Which content moves to the database?

A) **Grade 2 Vietnamese + Grade 2 English only** — the two subjects you named, nothing else

B) **Grade 1 + Grade 2 Vietnamese and English** (all four language-subject quizzes); Math stays runtime-generated, Preschool (shapes/colors/animals) stays in `translations.ts` *(Recommended)*

C) **All static quiz content** — Preschool (shapes, colors, animals) + Grade 1 + Grade 2 language subjects move to the DB; only the runtime math generators stay in code

D) Other (please describe after [Answer]: tag below)

[Answer]:C

---

## Question 2 — Database schema shape

A) **One generic `quiz_questions` table** keyed by `category` (e.g. `grade2Vietnamese`), with columns: `prompt`, `options` (JSONB array), `correct_index`, `difficulty` (nullable), `locale`, `is_active`, `sort_order`. Future categories just add rows. *(Recommended — mirrors how `stickers` is a single flat catalog table)*

B) **Two normalized tables**: `subjects` (id, name, target language, grade) + `subject_questions` (FK to subject, prompt, options, correct answer, difficulty)

C) **One table per subject** (e.g. `vietnamese_questions`, `english_questions`)

D) Other (please describe after [Answer]: tag below)

[Answer]:B

---

## Question 3 — How the Vietnamese-subject language bug should be fixed

A) **Content has one fixed language per subject.** The Vietnamese subject is authored and always displayed in Vietnamese; the English subject in English. The UI language switch never changes question/answer text for these subjects (it still changes buttons, titles, difficulty badge, etc.). *(Recommended)*

B) **Store a `vi` and `en` version of every question** in the DB, but always show the Vietnamese subject's `vi` text and the English subject's `en` text regardless of UI locale (keeps a translation column for future use, more authoring work)

C) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 4 — English-subject question style (for Vietnamese-speaking children)

A) **Fully English** — prompt and all answer options in English (e.g. "What is the opposite of 'hot'?" → Warm / Cold / Wet). Matches how Grade 2 English is authored today. *(Recommended)*

B) **English prompt, Vietnamese answer options / hints** — e.g. "What does 'Apple' mean?" → Quả cam / Quả táo / Quả chuối (matches how Grade 1 English is authored today)

C) **Mix by question** — some vocabulary questions use Vietnamese options, grammar/logic questions stay fully English (I'll specify per question during content authoring)

D) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 5 — Grade 1 vs Grade 2 banks

*(Answer only if Q1 = B or C)*

A) **Keep separate banks per (grade, subject)** — Grade 1 Vietnamese and Grade 2 Vietnamese are distinct question sets with different difficulty, surfaced by their existing category ids *(Recommended)*

B) **Merge into one bank per subject** — a single Vietnamese pool and a single English pool, shared across Grade 1 and Grade 2

C) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 6 — How much new content, and how many questions per session

Target size of each subject question bank (I will author the new questions):

A) **~30 questions per subject bank**, 10 shown per session

B) **~50 questions per subject bank**, 10 shown per session *(Recommended — meaningful variety without an overwhelming authoring/review load)*

C) **~100 questions per subject bank**, 10 shown per session

D) Other (please describe — e.g. a different bank size or a different per-session count — after [Answer]: tag below)

[Answer]:B

---

## Question 7 — Applying the schema + seed data to the live Supabase database

The migration file and the content seed need to reach the hosted project (`eoelyqphaixgqlkyoxau`). CI does **not** run migrations.

A) **I (the user) will run `supabase db push` / `supabase migration up`** against the linked project after you commit the migration *(Recommended)*

B) **You provide a single SQL script** and I paste it into the Supabase Dashboard SQL editor

C) **Both** — commit a proper migration file AND also produce a standalone paste-able SQL script

D) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 8 — Managing content after this initiative

A) **SQL-file managed** — questions live in a migration/seed file in the repo; edits are new SQL. No admin UI. *(Recommended for now)*

B) **Add a read + write admin API** (`/api/admin/quiz-questions`) gated to an admin role, no UI

C) **Add a small admin UI page** for editing questions in-app

D) Other (please describe after [Answer]: tag below)

[Answer]:B

---

## Question 9 — Behavior if the questions API fails to load

A) **Show a friendly error in the quiz modal** ("Couldn't load questions, try again") with a retry button; no bundled fallback *(Recommended — keeps the DB as the single source of truth)*

B) **Fall back to a small bundled set** of a few questions per subject shipped in code, so a quiz can always start

C) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 10 — Fix the `quiz_history.category` constraint gap in this initiative?

The DB `CHECK` constraint on `quiz_history.category` is missing `grade2Vietnamese` / `grade2English` (added to TypeScript + Zod but never to a migration), so those history rows silently fail to insert today.

A) **Yes — include the constraint fix** in this initiative's migration (recommended; we're already editing the schema) *(Recommended)*

B) **No — leave it out of scope**, handle separately

C) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 11 — Which automated tests should we write for this feature?

We found these test folders in your project:
- `automation_tests/unit/` → unit tests (individual functions) — ✅ already has tests
- `automation_tests/api/` → API tests (call your route's validation/logic directly, no server) — ✅ already has tests
- `automation_tests/e2e/` → E2E tests (real browser clicking through the app) — ✅ already has tests

Which tests should we write for this feature?

A) **Unit tests only** — the content service + any mapping/selection logic

B) **Unit + API tests** — also test the new questions API route contract (valid categories, response shape, auth) *(Recommended)*

C) **Unit + API + E2E tests** — also a browser test that opens a Vietnamese-subject quiz with the UI set to English and asserts the question text is Vietnamese

D) All three, plus updating the existing `grade2-subjects.spec.ts` E2E for the new async loading

X) Other (please describe after [Answer]: tag below)

[Answer]:D

---

## Question 12 — Security Extensions

Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]:B

---

## Question 13 — Resiliency Extensions

Should the resiliency baseline (AWS Well-Architected Reliability-pillar design-time best practices) be applied to this project?

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid iteration matters more)

X) Other (please describe after [Answer]: tag below)

[Answer]:B

---

## Question 14 — Property-Based Testing Extension

Should property-based testing (PBT) rules be enforced for this project? (The prior initiative chose "Partial — pure functions only".)

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT rules only for pure functions and serialization round-trips (matches the prior initiative)

C) No — skip all PBT rules

X) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 15 — Anything else

Any other constraints, preferences, or content guidance (topics to cover for each subject, tone, alignment to a specific Vietnamese Grade 1/2 curriculum, deadlines, things to avoid)?

[Answer]:No
