# Performance Test Instructions — Magic House (SupabaseBackendIntegration)

## Assessment

Performance testing for this application is scoped as follows:

| Test Type | Applicability | Rationale |
|---|---|---|
| Load / stress testing | **N/A** | Single-user, single-device children's app — no concurrent user target |
| API response time | **Light** | Verify Supabase round-trips are within acceptable range |
| Client-side rendering | **Light** | Verify no perceptible jank on quiz/canvas interactions |
| Math generation functions | **N/A** | Already measured via unit tests; microsecond-level CPU operations |

---

## Performance Targets

| Metric | Target | Notes |
|---|---|---|
| API routes (P95 cold) | < 2000ms | Supabase free tier; warm requests ~200ms |
| API routes (P95 warm) | < 500ms | After first request in session |
| Canvas debounce write | < 300ms scheduling | Debounce timer; actual write is fire-and-forget |
| Page initial load (TTI) | < 3000ms | Next.js SSR with hydration |

---

## Step 1 — Verify API Response Times (Manual)

Use browser DevTools (Network tab) while testing integration scenarios:

1. Open `http://localhost:3000` → sign in
2. Open DevTools → Network → filter by `api/`
3. Observe:
   - `GET /api/auth/session` — should complete < 500ms
   - `GET /api/players/me` + `GET /api/players/stickers` (parallel) — should complete < 1000ms combined
   - `GET /api/stickers` (catalog) — should complete < 500ms
   - `PUT /api/players/canvas` (debounced) — fires 300ms after last canvas change

4. Repeat actions 3–5 times to observe warm-cache behavior.

---

## Step 2 — Verify Client-Side Math Generation Performance

The quiz math generators (`generateAdditionQuestion`, `generateSubtractionQuestion`, `generateTimesTableQuestion`) must complete synchronously before rendering. Run a quick benchmark:

```typescript
// Add to a vitest benchmark file: tests/bench/learning-zone.bench.ts
import { bench, describe } from 'vitest'
import {
  generateAdditionQuestion,
  generateSubtractionQuestion,
  generateTimesTableQuestion
} from '@/components/learning-zone'

describe('quiz question generators', () => {
  bench('generateAdditionQuestion', () => {
    generateAdditionQuestion()
  })
  bench('generateSubtractionQuestion', () => {
    generateSubtractionQuestion()
  })
  bench('generateTimesTableQuestion', () => {
    generateTimesTableQuestion('en')
  })
})
```

Run:
```bash
npx vitest bench tests/bench/learning-zone.bench.ts
```

**Expected**: All generators < 1ms per call. At 10 questions per quiz, total generation < 10ms.

---

## Step 3 — Canvas Debounce Verification

1. Open Creative Room, drag 5 stickers to canvas quickly
2. Open DevTools → Network
3. Observe: only ONE `PUT /api/players/canvas` fires 300ms after the last sticker drop
4. Verify no burst of multiple PUT requests during fast drag operations

**Pass criteria**: ≤ 1 PUT per 300ms quiet window.

---

## Step 4 — Memory Leak Check (Optional)

1. Open Creative Room
2. Drag and drop 20+ stickers to canvas
3. Remove all stickers (clear all)
4. Open DevTools → Memory → Take Heap Snapshot
5. Repeat drag/drop/clear 3 more times
6. Take another heap snapshot

**Pass criteria**: Heap size returns to baseline after clearing stickers. No retained `PlacedSticker` objects.

---

## Notes

- The Supabase free tier (shared infrastructure) may show higher latency than production. Document baseline measurements from the development Supabase project.
- The canvas `PUT` uses fire-and-forget — API failures are silent and do not block the UI. No performance optimization needed for this path.
- `GET /api/stickers` is a read from the `stickers` table (16 rows, no RLS scan overhead) — expected to be fast consistently.
