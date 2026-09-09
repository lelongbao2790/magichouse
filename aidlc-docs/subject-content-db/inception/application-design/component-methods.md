# Component Methods — subject-content-db

Signatures only; detailed business rules → Functional Design (per unit).

---

## Shared types (`lib/subject-content/types.ts` or `lib/database.types.ts`)

```ts
type Locale = 'vi' | 'en'
type Difficulty = 'easy' | 'medium' | 'hard'          // reuse lib/coin-rewards.ts
type ContentMode = 'fixed' | 'localized'

interface SubjectRow {
  id: string
  key: string
  title_vi: string
  title_en: string
  grade: 'preschool' | 'grade1' | 'grade2'
  target_language: Locale
  content_mode: ContentMode
  questions_per_session: number
  sort_order: number
}

interface SubjectQuestionRow {
  id: string
  subject_id: string
  prompt_vi: string | null
  prompt_en: string | null
  options_vi: string[] | null
  options_en: string[] | null
  correct_index: number
  difficulty: Difficulty
  is_active: boolean
  sort_order: number
}

// client-facing DTO — matches what QuizModal's `Question` expects today
interface QuestionDto {
  id: string
  question: string
  options: string[]          // length 3
  correctIndex: number       // 0..2
  difficulty: Difficulty
}

interface SubjectContentDto {
  key: string
  title: string              // resolved for the UI locale
  questionsPerSession: number
  questions: QuestionDto[]    // all active, resolved
}
```

---

## C2 — `lib/subject-content/resolve.ts`

```ts
class IncompleteQuestionError extends Error { constructor(questionId: string) }

// Pick the right language pair for one question, per the subject's content_mode.
function resolveQuestion(
  row: SubjectQuestionRow,
  subject: Pick<SubjectRow, 'content_mode' | 'target_language'>,
  uiLocale: Locale,
): QuestionDto
// fixed     -> uses subject.target_language columns (uiLocale ignored)
// localized -> uses uiLocale columns
// throws IncompleteQuestionError if the needed prompt/options are null

function resolveTitle(subject: SubjectRow, uiLocale: Locale): string
// always follows uiLocale (title is UI chrome) -> title_vi | title_en

// round-trip mappers (PBT-C)
function rowToDto(row: SubjectQuestionRow, subject, uiLocale): QuestionDto
function dtoToWritePayload(dto: QuestionDto, subject): Partial<SubjectQuestionRow>
```

---

## C3 — `lib/quiz-session.ts`

```ts
type Rng = () => number   // returns [0,1); defaults to Math.random

function pickSessionQuestions<T extends { id: string }>(
  pool: T[],
  n: number,
  rng?: Rng,
): T[]
// returns min(n, pool.length) items, shuffled, no duplicates, subset of pool
```

---

## C4 — `lib/admin-auth.ts`

```ts
function isAdminEmail(
  email: string | null | undefined,
  allowlistCsv: string | undefined,
): boolean
// case-insensitive; trims each CSV entry; '' / undefined allowlist => false

function getAdminEmails(): string | undefined   // process.env.ADMIN_EMAILS
```

---

## C5 — `lib/services/subject-content.ts`

```ts
type Supabase = SupabaseClient<Database>

// ---- reads (anon/authenticated client, RLS applies) ----
function listSubjects(sb: Supabase): Promise<SubjectRow[]>
function getSubjectByKey(sb: Supabase, key: string): Promise<SubjectRow | null>
function getActiveQuestions(sb: Supabase, subjectId: string): Promise<SubjectQuestionRow[]>

// orchestrator used by the gameplay route
function getSubjectContent(
  sb: Supabase,
  key: string,
  uiLocale: Locale,
): Promise<SubjectContentDto | null>
// null when key unknown; filters out (and console.warns) any row that throws
// IncompleteQuestionError

// ---- writes (service-role client, called only after the admin gate) ----
function listAllQuestionsForSubject(sb: Supabase, subjectKey: string): Promise<SubjectQuestionRow[]>
function createQuestion(sb: Supabase, input: SubjectQuestionCreateInput): Promise<SubjectQuestionRow>
function updateQuestion(sb: Supabase, id: string, patch: SubjectQuestionUpdateInput): Promise<SubjectQuestionRow>
function deleteQuestion(sb: Supabase, id: string): Promise<void>
```

---

## C6 — `GET /api/subjects/[key]/questions`

```
Request:  GET /api/subjects/grade2Vietnamese/questions?locale=en
Auth:     required (401 otherwise)
Query:    locale ∈ {vi,en}  (LocaleSchema, default 'vi')
200:      { data: SubjectContentDto, error: null }
404:      { data: null, error: 'Subject not found' }   // unknown key
401/500:  standard apiError shape
```

Handler flow: `createServerClient()` → `auth.getUser()` → parse `key`,`locale` →
`getSubjectContent(sb, key, locale)` → `apiSuccess` / 404.

---

## C7 — `GET /api/admin/subjects`

```
Auth:   authenticated AND isAdminEmail(user.email, getAdminEmails())
200:    { data: SubjectRow[], error: null }
401:    not authenticated
403:    authenticated but not allowlisted
```

---

## C8 — `/api/admin/subject-questions`

```
All methods: auth gate + admin gate first. Writes use createAdminClient().

GET    ?subjectKey=grade2English      -> { data: SubjectQuestionRow[] (incl. inactive) }
POST   body: SubjectQuestionCreateSchema  -> 201 { data: SubjectQuestionRow }
PATCH  body: SubjectQuestionUpdateSchema ({ id, ...fields })  -> { data: SubjectQuestionRow }
DELETE ?id=<uuid>                     -> { data: null }
400:   Zod failure (option count ≠ 3, correct_index out of 0..2, missing locale text
       for the subject's mode, bad difficulty, unknown subjectKey)
```

---

## C9 — `useSubjectQuestions`

```ts
interface UseSubjectQuestions {
  data: SubjectContentDto | null
  isLoading: boolean
  error: boolean
  retry: () => void
}
function useSubjectQuestions(key: string | null): UseSubjectQuestions
// key === null  -> idle ({ data:null, isLoading:false, error:false })
// fetches GET /api/subjects/{key}/questions?locale={current UI locale}
// module-level Map<`${key}:${locale}`, SubjectContentDto> cache
```

---

## C10 — `QuizModal` prop additions

```ts
interface QuizModalProps {
  // ...existing...
  isLoading?: boolean
  loadError?: boolean
  onRetry?: () => void
}
// render priority: loadError -> error view ; isLoading -> loading view ; else quiz
```

---

## C11 — `LearningZone` internal

```ts
// content subjects only
const CONTENT_SUBJECT_KEYS = ['shapes','colors','animals','vietnamese','english',
                              'grade2Vietnamese','grade2English'] as const

const isContentSubject = (id: string | null) =>
  !!id && CONTENT_SUBJECT_KEYS.includes(id as any)

// when activeQuiz is a content subject:
const content = useSubjectQuestions(isContentSubject(activeQuiz) ? activeQuiz : null)
const sessionQuestions = useMemo(
  () => content.data ? pickSessionQuestions(content.data.questions,
                                            content.data.questionsPerSession) : [],
  [content.data],
)
```

---

## C13 — Validation schemas (`lib/validation/api.ts`)

```ts
const LocaleSchema = z.enum(['vi','en'])

const OptionsSchema = z.array(z.string().min(1)).length(3)

const SubjectQuestionCreateSchema = z.object({
  subjectKey: z.string().min(1),
  promptVi: z.string().min(1).nullable().optional(),
  promptEn: z.string().min(1).nullable().optional(),
  optionsVi: OptionsSchema.nullable().optional(),
  optionsEn: OptionsSchema.nullable().optional(),
  correctIndex: z.number().int().min(0).max(2),
  difficulty: z.enum(['easy','medium','hard']),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})
// .superRefine: the (vi|en) pair(s) required by the target subject's content_mode
// must be present — mode looked up server-side; the schema enforces "at least the
// target-language pair is non-null and self-consistent (prompt & options together)".

const SubjectQuestionUpdateSchema = SubjectQuestionCreateSchema
  .partial()
  .extend({ id: z.string().uuid() })
```
