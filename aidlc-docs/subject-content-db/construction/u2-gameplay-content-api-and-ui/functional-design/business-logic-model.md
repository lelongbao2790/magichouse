# Business Logic Model — U2 gameplay-content-api-and-ui

## 1. `pickSessionQuestions(pool, n, rng = Math.random)` → `QuestionDto[]`

```
if n <= 0 or pool is empty: return []
if pool.length <= n: return shuffle(pool, rng)

target = { easy: round(n*0.4), medium: round(n*0.4), hard: n - round(n*0.4) - round(n*0.4) }

buckets = groupBy(pool, q => q.difficulty)          // { easy:[…], medium:[…], hard:[…] }
picked = []
for d in ['easy','medium','hard']:
    take = min(target[d], buckets[d].length)
    picked.push(...sampleWithoutReplacement(buckets[d], take, rng))

if picked.length < n:
    remaining = pool.filter(q => q not in picked)
    picked.push(...sampleWithoutReplacement(remaining, n - picked.length, rng))

return shuffle(picked, rng)
```

Helpers (all rng-driven, pure):
- `shuffle(arr, rng)` — Fisher-Yates copy
- `sampleWithoutReplacement(arr, k, rng)` — shuffle then `slice(0, k)`

## 2. `useSubjectQuestions(key)` — state machine

```
                 key === null
                     │
                     ▼
                 ┌───────┐
                 │ idle  │
                 └───────┘
     key set / cache miss │      │ key set / cache HIT
                          ▼      ▼
                     ┌─────────┐   ┌────────┐
                     │ loading │   │ ready  │
                     └─────────┘   └────────┘
        fetch ok, questions>0 │ ▲          ▲
                              ▼ │ retry()  │ fetch ok, questions>0
                     ┌────────┐ │          │
                     │ ready  │ └──────────┘
                     └────────┘
   fetch ok, questions===0 │        │ fetch 404 / !ok / throw
                           ▼        ▼
                     ┌────────┐  ┌────────┐
                     │ empty  │  │ error  │   (error='load', retry() re-fetches)
                     └────────┘  └────────┘
                     (error='empty', retry no-op)
```

- On `key` or `language` change: recompute cache key `${key}:${locale}`. Hit → `ready`
  immediately. Miss → `loading` + fetch.
- Stale-response guard: when a fetch resolves, compare its `(key, locale)` to the current
  ones; drop if changed (BR-U2-2.6).
- `retry()`: if `error==='load'`, `cache.delete(cacheKey)` then re-run the effect.

Implementation: `useState` for `{phase, data, error}` + `useEffect([key, language])` +
`useRef` for the request-id guard. `retry` bumps a `retryTick` state included in the effect
deps.

## 3. `LearningZone` wiring

```
const { language } = useLanguage()
const isContent = activeQuiz != null && CONTENT_SUBJECT_KEYS.includes(activeQuiz)
const content = useSubjectQuestions(isContent ? activeQuiz : null)

// FROZEN on open: deps are [activeQuiz] only — NOT [language] (BR-U2-3.1, Q1=A)
const sessionQuestions = useMemo(
  () => (content.phase === 'ready' && content.data
          ? pickSessionQuestions(content.data.questions, content.data.questionsPerSession)
          : []),
  [activeQuiz, content.phase],   // eslint: content.data intentionally omitted; phase gates it
)

// render:
if (isContent) {
  <QuizModal
     title={content.data?.title ?? ''}
     questions={sessionQuestions}
     isLoading={content.phase === 'loading'}
     loadError={content.error === 'load'}
     emptyError={content.error === 'empty'}
     onRetry={content.retry}
     onComplete={handleQuizCompleteInternal}
     ... />
} else {
  // math: unchanged synchronous path
}
```

`handleQuizCompleteInternal` unchanged (BR-U2-5.4).

## 4. `GET /api/subjects/[key]/questions/route.ts`

```
export async function GET(request, { params }) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const { key } = await params
    const url = new URL(request.url)
    const parsed = LocaleSchema.safeParse(url.searchParams.get('locale') ?? 'vi')
    if (!parsed.success) return apiError('Invalid locale', 400)

    const content = await getSubjectContent(supabase, key, parsed.data)
    if (!content) return apiError('Subject not found', 404)
    return apiSuccess(content)
  } catch (err) {
    console.error('[GET /api/subjects/[key]/questions]', err)
    return apiError('Internal server error', 500)
  }
}
```

(Next 16: `params` is a Promise in route handlers — `await params`.)

---

## 5. Testable Properties (PBT-01 — BLOCKING) — PBT-A

### `pickSessionQuestions` (`lib/quiz-session.ts`)

| ID | Category | Property | Test |
|---|---|---|---|
| TP-A1 | Invariant (size) | For any `pool` and `n ≥ 0`: `result.length === min(n, pool.length)`. | `quiz-session.pbt.test.ts` |
| TP-A2 | Invariant (subset) | Every element of `result` is `===` an element of `pool` (identity preserved). | same |
| TP-A3 | Invariant (no dup) | `result` has no duplicate `id`s. | same |
| TP-A4 | Invariant (integrity) | Every `result` item still satisfies `options.length === 3` and `0 ≤ correctIndex ≤ 2` (pass-through, not mutated). | same |
| TP-A5 | Invariant (balance, weak) | When the pool has `≥ target[d]` questions of every difficulty `d`, the result's difficulty histogram equals `target` exactly. When a bucket is short, `result` still has length `min(n, pool.length)` and the deficit is covered from other buckets. | same + example tests |
| TP-A6 | Determinism | With a seeded `rng` (same seed), two calls with the same `pool`,`n` produce identical results. | example-based |

Generators (PBT-07): `questionDtoArb` (id, 3 options, correctIndex 0..2, difficulty),
`poolArb = fc.array(questionDtoArb, { minLength: 0, maxLength: 120 })`, `nArb =
fc.integer({ min: 0, max: 30 })`, `seededRng` from `fc.integer` → a small LCG.

Example tests (PBT-10): a 50-question pool with a known difficulty spread → assert the
session is 4 easy / 4 medium / 2 hard; a pool with only `hard` questions → session is all
hard, length `min(n, pool.length)`; Grade 1 Vietnamese (3 questions) → session is those 3.

### `useSubjectQuestions` — not PBT (React + I/O). Covered by component/hook tests
(`renderHook`, mocked `fetch`): idle/loading/ready/error/empty transitions, cache hit,
retry, stale-response guard.

### PBT compliance summary (U2)

| Rule | Status |
|---|---|
| PBT-01 | ✅ this section |
| PBT-02 round-trip | N/A — U2 has no invertible transform (resolution round-trip is U1) |
| PBT-03 invariant | ✅ TP-A1..A5 |
| PBT-04 idempotency | N/A |
| PBT-05 oracle | N/A |
| PBT-06 stateful | N/A — `pickSessionQuestions` pure; the hook's state machine is tested example-based, no model needed |
| PBT-07 generators | ✅ `questionDtoArb`, `poolArb`, seeded rng |
| PBT-08 seed/shrink | ✅ (CI, Build & Test) |
| PBT-09 framework | fast-check (recorded U1; unchanged) |
| PBT-10 complementary | ✅ example tests listed |
