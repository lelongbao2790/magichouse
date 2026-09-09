# Component Dependency — subject-content-db

## Dependency matrix

| Component | Depends on | Kind |
|---|---|---|
| C1 schema (migrations) | existing `update_updated_at_column()`, `quiz_history` | DDL |
| C2 `resolve.ts` | shared types only | compile |
| C3 `quiz-session.ts` | — (pure) | — |
| C4 `admin-auth.ts` | `process.env.ADMIN_EMAILS` | runtime |
| C5 `services/subject-content.ts` | C1 (tables), C2 (resolve), `database.types` | compile + runtime |
| C6 gameplay route | C5, `lib/supabase/server`, `api-response`, `validation/api` (LocaleSchema) | runtime |
| C7 admin subjects route | C4, C5, `lib/supabase/server`, `api-response` | runtime |
| C8 admin questions route | C4, C5, `lib/supabase/server`, `lib/supabase/admin`, `validation/api` | runtime |
| C9 `useSubjectQuestions` | C6 (HTTP), `language-context` | runtime |
| C10 `QuizModal` | `language-context`, `coin-rewards` (Difficulty) | compile |
| C11 `LearningZone` | C9, C3, C10, `coin-rewards`, `language-context` | compile |
| C12 `translations.ts` | — (keys removed) | — |
| C13 types + schemas | `zod`, `database.types` | compile |
| C14 config files | — | build/CI |

No circular dependencies. C2, C3, C4 are leaves (pure).

## Data flow — gameplay (bug fix path)

```
Student clicks "Grade 2 Vietnamese" (UI language = English)
   |
   v
LearningZone: activeQuiz = 'grade2Vietnamese'  -> useSubjectQuestions('grade2Vietnamese')
   |
   v
GET /api/subjects/grade2Vietnamese/questions?locale=en      (C6)
   |  auth ok
   v
getSubjectContent(sb, 'grade2Vietnamese', 'en')             (C5)
   |
   |  subject.content_mode = 'fixed', target_language = 'vi'
   v
resolveQuestion(row, subject, 'en')  --> uses prompt_vi / options_vi   (C2)  ← BUG FIX
   |                                       ('en' argument ignored for fixed subjects)
   v
{ title: "Grade 2 Vietnamese Quiz" (title_en — chrome follows UI),
  questions: [ { question: "<Vietnamese text>", options: [<Vietnamese>], ... } ] }
   |
   v
pickSessionQuestions(questions, 10)                         (C3)
   |
   v
<QuizModal>  — questions in Vietnamese, chrome in English
```

## Data flow — localized subject (preschool, unchanged behaviour)

```
UI language = 'vi'  ->  GET /api/subjects/shapes/questions?locale=vi
   subject.content_mode = 'localized'
   resolveQuestion(row, subject, 'vi') --> prompt_vi / options_vi
UI language = 'en'  ->  ...?locale=en --> prompt_en / options_en
```

## Data flow — admin write

```
curl -X POST /api/admin/subject-questions  (cookie = allowlisted user)   (C8)
   auth.getUser() ok
   isAdminEmail(email, ADMIN_EMAILS) == true                             (C4)
   SubjectQuestionCreateSchema.parse(body)                               (C13)
   createAdminClient() (service role)                                    (lib/supabase/admin)
   createQuestion(admin, ...)  -> INSERT subject_questions               (C5 -> C1)
      trigger subject_questions_mode_check() validates locale coverage
```

## Build / change sequence (feeds Units Generation)

```
1. C1 (migrations) + C13 (database.types) + C2 + C3 + C4 + C5        [U1]
      nothing else compiles against the new shape until these exist
      + content authoring (seed migration)
2. C13 (LocaleSchema) + C6 + C9 + C11 + C10 + C12 + E2E specs        [U2]   depends on U1
3. C13 (admin schemas) + C4 wiring + C7 + C8 + C14 (.env.example)   [U3]   depends on U1
```

## Cross-cutting: PBT (blocking)

| Rule | Component | Where verified |
|---|---|---|
| PBT-01 (property identification) | C2, C3 | functional-design/*/business-logic-model.md → "Testable Properties" |
| PBT-02 (round-trip) | C2 `rowToDto`/`dtoToWritePayload` | `subject-content.pbt.test.ts` PBT-C |
| PBT-03 (invariant) | C3 selection, C2 resolution | PBT-A, PBT-B |
| PBT-07 (generators) | test utils | `automation_tests/unit/_arbitraries.ts` |
| PBT-08 (seed logging) | CI | `.github/workflows/ci.yml` unit step |
| PBT-09 (framework) | fast-check (already a dep) | nfr-requirements/tech-stack-decisions.md |
| PBT-10 (complementary) | example tests alongside each PBT | unit test files |
| PBT-04/05/06 | N/A — no idempotency claims, no oracle, no stateful component | compliance summary |
