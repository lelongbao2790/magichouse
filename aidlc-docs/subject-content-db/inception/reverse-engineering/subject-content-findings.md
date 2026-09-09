# Subject Content & i18n — Focused Findings

This artifact documents the parts of the codebase this initiative targets: how quiz /
subject content is currently defined, how the language switch affects it, and where the
gaps are.

## 1. How quiz content is defined today (all hardcoded)

All quiz questions live in **`data/translations.ts`** as a single frozen object keyed by
"section". Each question/option is a `{ vi, en }` pair.

| Section key | Subject / grade | # questions | vi vs en content |
|---|---|---|---|
| `quizShapes` | Preschool – Shapes | 10 | genuinely bilingual |
| `quizColors` | Preschool – Colors | 10 | genuinely bilingual |
| `quizAnimals` | Preschool – Animals | 10 | genuinely bilingual |
| `quizMath` | Grade 1 – Math | title only (questions generated at runtime) | n/a |
| `quizVietnamese` | Grade 1 – Vietnamese | **3** | vi = Vietnamese lesson, en = English translation of the lesson |
| `quizEnglish` | Grade 1 – English | 10 | vi = Vietnamese gloss, en = English |
| `quizAddition` / `quizSubtraction` / `quizTimesTable` | Grade 2 – Math | title only (runtime-generated) | n/a |
| `quizVietnameseGrade2` | Grade 2 – Vietnamese | **15** | vi = Vietnamese lesson, en = English translation of the lesson |
| `quizEnglishGrade2` | Grade 2 – English | **15** | vi and en are **identical** (English) |

Runtime assembly happens in **`components/learning-zone.tsx`**:
- `quizData` object maps each category id → `{ title, questions[] }`
- Each question is built inline as
  `{ question: t("quizVietnameseGrade2", "q1"), options: [t(...,"q1o1"), ...], correctIndex, difficulty: randomDifficulty() }`
- Grade 2 VN/EN use a 15-question pool, `shuffleAndTake(pool, 10)` per session
- `correctIndex` for each question is a **magic number literal** in the component array,
  decoupled from the content in `translations.ts` — fragile.

`t(section, key)` (in **`contexts/language-context.tsx`**) simply returns
`translations[section][key][language]`, where `language` is the **UI language** from the
language switcher (persisted in `localStorage` under `kids-app-language`, default `vi`).

## 2. The language bug

Because question text is resolved through `t()` with the **UI language**:

- **Grade 2 Vietnamese subject** (teaches the Vietnamese language): when the UI is
  switched to English, every question and option renders in English
  (e.g. `q1` → "Which word names a color?" with options "Run / Red / Table").
  A Vietnamese-language lesson shown entirely in English is not usable as a Vietnamese
  lesson. **This is the bug the user reported.**
- **Grade 1 Vietnamese subject** has the same defect (only 3 questions).
- **Grade 2 English subject** happens to be safe only because its `vi` and `en` strings
  were authored identically — i.e. the data is duplicated, not truly localized.
- **Grade 1 English subject** (`quizEnglish`): prompts like "What does 'Apple' mean?" with
  the answer options localized — when UI = en the options are English words, when UI = vi
  the options are Vietnamese. This is arguably intended (a Vietnamese child learning
  English) but is inconsistent with how Grade 2 English is authored.

**Root cause**: subject-learning content is being treated as UI chrome (localizable) when
it is actually **instructional content in a fixed target language**. The question
"what language should this lesson render in" is a property of the *subject*, not of the
UI locale.

## 3. Database state

`supabase/migrations/0001_initial_schema.sql` is the only migration. Relevant table:

```sql
CREATE TABLE quiz_history (
  ...
  category text NOT NULL CHECK (category IN (
    'shapes','colors','animals','math','vietnamese',
    'english','addition','subtraction','timesTable'
  )),
  ...
);
```

- There is **no table for quiz/subject content** — it is 100% in the TS bundle.
- The `stickers` table + `supabase/seed.sql` (22 rows) is the existing precedent for
  "reference data in the DB, read via an API route" — see `getCatalog()` in
  `lib/services/stickers.ts` and `GET /api/stickers`.
- **Latent gap**: `lib/database.types.ts` and `lib/validation/api.ts` were extended with
  `grade2Vietnamese` / `grade2English` categories, but the DB `CHECK` constraint in
  `0001_initial_schema.sql` was **never updated**. Any `POST /api/quiz/history` with
  `category: 'grade2Vietnamese'` currently violates the CHECK constraint on the live DB
  (the write is fire-and-forget `.catch(() => {})` in `learning-zone.tsx`, so the failure
  is silent). A migration is needed regardless of this initiative's approach.

## 4. Supabase access pattern (precedent to follow)

- `lib/supabase/server.ts` — `createServerClient()` (anon key + cookies, RLS-scoped)
- `lib/supabase/admin.ts` — `createAdminClient()` (service-role, server-only)
- `lib/supabase/client.ts` — `createClient()` (browser singleton)
- Service functions in `lib/services/*.ts` take a `SupabaseClient<Database>` as first arg
  and return plain data or throw.
- API routes: `createServerClient()` → `auth.getUser()` gate → service call →
  `apiSuccess(data)` / `apiError(msg, status)`.
- `stickers` RLS: `FOR SELECT USING (auth.role() = 'authenticated')` — catalog readable by
  any signed-in user, writes only via service role / migration+seed.
- Migrations are applied out-of-band (Supabase CLI is a dev dependency; project is linked
  — `supabase/.temp/project-ref` = `eoelyqphaixgqlkyoxau`). CI does **not** run migrations.

## 5. Frontend data-loading precedent

`components/sticker-shop.tsx` uses `useEffect(() => { fetch('/api/stickers')... }, [])`
to load catalog data client-side into state. `learning-zone.tsx` currently does **no**
async loading — all quiz data is synchronous from `translations.ts`. Moving content to
the DB means `learning-zone.tsx` (or a new hook/context) must fetch and handle
loading/empty/error states, and the `QuizModal` must tolerate an async/empty question
list.

## 6. Tests touching this area

- `automation_tests/unit/learning-zone.test.ts` (38 tests) — question generator logic
- `automation_tests/unit/learning-zone.pbt.test.ts` — fast-check PBT for generators
- `automation_tests/unit/coin-rewards.test.ts` (30 tests)
- `automation_tests/api/quiz-history.api.test.ts` (24 tests) — `QuizHistorySchema` incl.
  `grade2Vietnamese` / `grade2English`
- `automation_tests/e2e/grade2-subjects.spec.ts` — Grade 2 nav + difficulty badge
- `vitest.config.ts` coverage threshold: **lines ≥ 80%**, includes
  `lib/services/**`, `app/api/**`, `components/**` (excl. `components/ui/**`)
- CI (`.github/workflows/ci.yml`) has `INITIATIVE: grade2-subjects-coin-rewards`
  hardcoded for report paths.
