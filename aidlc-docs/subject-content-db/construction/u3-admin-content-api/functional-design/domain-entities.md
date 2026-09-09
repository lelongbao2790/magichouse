# Domain Entities — U3 admin-content-api

U3 adds no tables. It reuses U1's `subjects` / `subject_questions` and the U1 service
write functions.

## Config

```
ADMIN_EMAILS   env var, comma-separated list of admin emails
               e.g.  ADMIN_EMAILS=you@example.com, teammate@example.com
               unset / empty  ->  no admins (fail closed, Q1=A)
```

## Request / response shapes

### `GET /api/admin/subjects`
```
200  { data: SubjectRow[], error: null }        // raw rows (Q4=A), sort_order asc
401 / 403
```

### `GET /api/admin/subject-questions?subjectKey=<key>`
```
200  { data: SubjectQuestionRow[], error: null } // ALL rows (active + inactive), sort_order asc
400  unknown subjectKey
401 / 403
```

### `POST /api/admin/subject-questions`
```
body: SubjectQuestionCreateInput
  {
    subjectKey:   string        // resolved to subject_id server-side
    promptVi?:    string | null
    promptEn?:    string | null
    optionsVi?:   string[] (len 3) | null
    optionsEn?:   string[] (len 3) | null
    correctIndex: 0 | 1 | 2
    difficulty:   'easy' | 'medium' | 'hard'
    isActive?:    boolean        // default true
    sortOrder?:   number         // default: (max sort_order for the subject) + 1
  }
201  { data: SubjectQuestionRow, error: null }
400  validation failure (see business-rules BR-U3-3)
401 / 403
```
`source_key` is **not** accepted (Q5=A) — always `NULL` for admin-created rows.

### `PATCH /api/admin/subject-questions`
```
body: { id: string (uuid) } & Partial<SubjectQuestionCreateInput without subjectKey>
  // any subset of: promptVi, promptEn, optionsVi, optionsEn, correctIndex,
  //                difficulty, isActive, sortOrder
200  { data: SubjectQuestionRow, error: null }
400 / 401 / 403 / 404 (unknown id)
```
`isActive: false` is the "deactivate" / soft-delete operation (Q3=A).

### `DELETE /api/admin/subject-questions?id=<uuid>`
```
200  { data: null, error: null }     // hard delete (Q3=A)
400 (missing/invalid id) / 401 / 403
```

## Types (`lib/admin-auth.ts`)

```ts
function isAdminEmail(email: string | null | undefined, allowlistCsv: string | undefined): boolean
function getAdminEmails(): string | undefined     // process.env.ADMIN_EMAILS
```

## Zod schemas (`lib/validation/api.ts` — additive to U1's block)

```ts
OptionsArraySchema            // z.array(z.string().min(1)).length(3)
SubjectQuestionCreateSchema   // subjectKey + optional locale text + correctIndex + difficulty + flags
SubjectQuestionUpdateSchema   // { id: uuid } + all create fields partial (no subjectKey)
```
