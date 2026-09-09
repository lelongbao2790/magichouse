# Business Logic Model — U3 admin-content-api

## 1. `isAdminEmail(email, allowlistCsv)` (pure)

```
if !allowlistCsv or allowlistCsv.trim() === '': return false
if !email: return false
set = allowlistCsv.split(',').map(trim).filter(Boolean).map(toLowerCase)
return set.includes(email.trim().toLowerCase())
```

## 2. Shared gate (every admin route)

```
async function requireAdmin(): { supabase, admin } | Response {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user)                                   return apiError('Not authenticated', 401)
  if (!isAdminEmail(user.email, getAdminEmails()))      return apiError('Forbidden', 403)
  return { user, admin: createAdminClient() }
}
```

## 3. `GET /api/admin/subjects`

```
gate -> admin
listSubjects(admin) -> apiSuccess(rows)     // raw SubjectRow[]
```

## 4. `/api/admin/subject-questions`

### GET
```
gate -> admin
key = searchParams.subjectKey ; if missing -> 400
subject = getSubjectByKey(admin, key) ; if null -> 400 "Unknown subject"
listAllQuestionsForSubject(admin, key) -> apiSuccess(rows)   // active + inactive
```

### POST
```
gate -> admin
input = SubjectQuestionCreateSchema.parse(body)              // Zod -> 400
subject = getSubjectByKey(admin, input.subjectKey) ; null -> 400
validateModeCoverage(finalRow=input, subject)                // BR-U3-3.2 -> 400
sortOrder = input.sortOrder ?? (maxSortOrder(admin, subject.id) + 1)
row = createQuestion(admin, { subjectId: subject.id, ...input, sortOrder, sourceKey: null })
console.log('[admin] POST subject_questions', row.id, 'by', user.email)
-> apiSuccess(row) 201
catch PG error (trigger/constraint) -> apiError(translate(err), 400)
```

### PATCH
```
gate -> admin
{ id, ...patch } = SubjectQuestionUpdateSchema.parse(body)   // Zod -> 400
current = getQuestionById(admin, id) ; null -> 404
if patch touches prompt/options:
    subject = getSubjectById(admin, current.subject_id)
    validateModeCoverage(merge(current, patch), subject)     // BR-U3-3.2 -> 400
row = updateQuestion(admin, id, patch)
console.log('[admin] PATCH subject_questions', id, 'by', user.email)
-> apiSuccess(row)
catch PG error -> apiError(translate(err), 400)
```

### DELETE
```
gate -> admin
id = searchParams.id ; if !uuid -> 400
deleteQuestion(admin, id)                                    // idempotent
console.log('[admin] DELETE subject_questions', id, 'by', user.email)
-> apiSuccess(null)
```

## 5. `validateModeCoverage(row, subject)` (pure helper in `lib/subject-content/resolve.ts` or `admin-auth`)

```
mode = subject.content_mode ; L = subject.target_language ; other = L==='vi'?'en':'vi'
hasL     = row['prompt_'+L]     != null && row['options_'+L]     != null
hasOther = row['prompt_'+other] != null || row['options_'+other] != null
if mode === 'fixed':
    if !hasL:     throw ValidationError(`fixed '${L}' subject: prompt_${L} and options_${L} are required`)
    if hasOther:  throw ValidationError(`fixed '${L}' subject: prompt_${other}/options_${other} must be empty`)
else: // localized
    if row.prompt_vi==null || row.prompt_en==null || row.options_vi==null || row.options_en==null:
        throw ValidationError('localized subject: vi and en prompt+options are all required')
// options length / correctIndex range already guaranteed by Zod
```

## 6. Small service additions (`lib/services/subject-content.ts`)

U1 already has `createQuestion`, `updateQuestion`, `deleteQuestion`, `setQuestionActive`,
`listAllQuestionsForSubject`, `listSubjects`, `getSubjectByKey`. U3 adds:
- `getQuestionById(sb, id): Promise<SubjectQuestionRow | null>`
- `maxSortOrder(sb, subjectId): Promise<number>` (0 when the subject has no questions)
- `getSubjectById(sb, id): Promise<SubjectRow | null>` (for PATCH mode-coverage)

---

## 7. Testable Properties (PBT-01)

U3's only pure logic is `isAdminEmail`, `validateModeCoverage`, and the Zod schemas.

| ID | Category | Property | Test |
|---|---|---|---|
| TP-U3-1 | Invariant | `isAdminEmail(e, csv)` is case-insensitive and whitespace-insensitive: for any email `e` in `csv` (any case/padding), it returns `true`; for any `e` not in `csv`, `false`; empty/undefined `csv` → always `false`. | unit (example-based; small input space — PBT optional) |
| TP-U3-2 | Invariant | `validateModeCoverage`: for a generated `fixed` subject + a row filled correctly for its target language and null elsewhere → no throw; a row missing the target pair OR setting the other locale → throws. For `localized` → all four required. | unit + optional fast-check over `subjectShapeArb` × row variants |
| TP-U3-3 | Invariant | `SubjectQuestionCreateSchema`: rejects option arrays not of length 3, `correctIndex` outside 0..2, unknown `difficulty`; accepts a well-formed payload. | unit (example-based) |

### PBT compliance summary (U3)

| Rule | Status |
|---|---|
| PBT-01 | ✅ this section (small surface — mostly example-based per PBT-10) |
| PBT-02 round-trip | N/A |
| PBT-03 invariant | ✅ TP-U3-1/2 (example-based is acceptable for this input space; a fast-check pass over `validateModeCoverage` is added) |
| PBT-04/05/06 | N/A — no idempotency claim in logic, no oracle, no stateful component (routes are stateless; the DB is the state and is not modelled) |
| PBT-07 generators | reuse `subjectShapeArb` from `_arbitraries.ts` for TP-U3-2 |
| PBT-08 | CI seed logging (Build & Test) |
| PBT-09 | fast-check (unchanged) |
| PBT-10 | ✅ example-based tests are the primary coverage here |

**Blocking-finding note**: no automated **route** tests (CL2=C) is a deliberate,
user-approved scope decision recorded in `test-case-design.md` and `aidlc-state.md` — it is
**not** a PBT finding. The pure logic (`isAdminEmail`, `validateModeCoverage`, schemas) IS
unit-tested.
