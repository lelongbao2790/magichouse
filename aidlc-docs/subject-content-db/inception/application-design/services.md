# Services — subject-content-db

The app is a Next.js monolith. "Service" here = the `lib/services/` data-access module plus
the API routes that orchestrate it — the same layering the codebase already uses
(`lib/services/stickers.ts` + `GET /api/stickers`).

---

## S1 — Subject Content Service (`lib/services/subject-content.ts`)

**Responsibility**: the only place that talks to the `subjects` / `subject_questions`
tables. Pure functions taking a `SupabaseClient<Database>`; no Next.js, no React.

**Orchestration**
- `getSubjectContent(sb, key, locale)`:
  1. `getSubjectByKey(sb, key)` → null ⇒ return null (route → 404).
  2. `getActiveQuestions(sb, subject.id)` ordered by `sort_order, created_at`.
  3. `map` each row through `resolveQuestion(row, subject, locale)`; a row that throws
     `IncompleteQuestionError` is skipped and `console.warn`-logged (never partially
     rendered — NFR-3).
  4. `title = resolveTitle(subject, locale)`.
  5. Return `SubjectContentDto` (all active, resolved; the route does not paginate).
- Session subsetting is **not** done here — the client does it with `pickSessionQuestions`
  so it is DB-free testable (FR-3.3).

**Writes** (`createQuestion` / `updateQuestion` / `deleteQuestion` / `setQuestionActive`)
- Called only from the admin routes, only after the admin gate, with the **service-role**
  client. Translate the API's camelCase input to the row's snake_case columns.

---

## S2 — Gameplay Content Route (`app/api/subjects/[key]/questions/route.ts`)

**Responsibility**: authenticated read endpoint for gameplay.

**Flow**
```
createServerClient()                      // anon key + cookies, RLS enforced
 -> auth.getUser()                        // 401 if no user
 -> key   = params.key
 -> locale = LocaleSchema.parse(searchParams.locale ?? 'vi')   // 400 on bad value
 -> getSubjectContent(sb, key, locale)
      -> null  => apiError('Subject not found', 404)
      -> dto   => apiSuccess(dto)
 -> catch => console.error(...) ; apiError('Internal server error', 500)
```

Errors surface to the client's `useSubjectQuestions` → `QuizModal` retry UI (TC-E014).

---

## S3 — Admin Subjects Route (`app/api/admin/subjects/route.ts`)

**Flow**
```
createServerClient() -> auth.getUser()                 // 401
 -> isAdminEmail(user.email, getAdminEmails())          // 403 if false
 -> listSubjects(sb) -> apiSuccess(rows)
```

---

## S4 — Admin Subject-Questions Route (`app/api/admin/subject-questions/route.ts`)

**Flow (all verbs)**
```
createServerClient() -> auth.getUser()                 // 401
 -> isAdminEmail(...)                                   // 403
 -> admin = createAdminClient()                         // service-role
 GET    : listAllQuestionsForSubject(admin, subjectKey)
 POST   : SubjectQuestionCreateSchema.parse(body)
          -> resolve subjectKey -> subject_id, check mode-required locale text
          -> createQuestion(admin, ...) -> 201
 PATCH  : SubjectQuestionUpdateSchema.parse(body) -> updateQuestion(admin, id, patch)
 DELETE : id = searchParams.id (uuid) -> deleteQuestion(admin, id)
 catch Zod  => apiError(firstIssue.message, 400)
 catch other => apiError('Internal server error', 500)
```

**No automated tests** for this route (CL2=C) — TC-M003 covers it manually. The pure
`isAdminEmail` and the Zod schemas *are* unit-tested.

---

## S5 — Frontend data hook (`lib/hooks/use-subject-questions.ts`)

Not a backend service, listed for completeness of the data path.

```
LearningZone (activeQuiz = content subject)
  -> useSubjectQuestions(key)
       -> cache hit  => { data, isLoading:false }
       -> cache miss => fetch GET /api/subjects/{key}/questions?locale={uiLocale}
            -> ok    => cache.set(`${key}:${locale}`, dto) ; { data }
            -> !ok   => { error:true }
  -> pickSessionQuestions(data.questions, data.questionsPerSession)
  -> <QuizModal questions=… isLoading=… loadError=… onRetry=hook.retry />
```

---

## Service Interaction Diagram

```
                         Browser
                            |
        +-------------------+--------------------+
        |                                        |
  LearningZone                              (admin tooling / curl)
        |                                        |
  useSubjectQuestions                            |
        |                                        |
        v                                        v
  GET /api/subjects/[key]/questions      /api/admin/subjects
        |                                /api/admin/subject-questions
        |   auth gate                            |  auth gate + isAdminEmail gate
        v                                        v
  lib/services/subject-content.ts  <-------------+
        |          |                             |
        |          v                             v
        |   lib/subject-content/resolve.ts   createAdminClient() (service role)
        |          (pure: fixed vs localized)     |
        v          v                             v
   createServerClient() (anon, RLS)   ----->  Supabase: subjects, subject_questions
                                                        quiz_history (CHECK updated)
```

---

## Non-goals for the service layer
- No caching in the service (client hook caches; NFR-2).
- No auth logic beyond `auth.getUser()` + `isAdminEmail` (no roles table).
- No write path for gameplay — players never mutate content.
