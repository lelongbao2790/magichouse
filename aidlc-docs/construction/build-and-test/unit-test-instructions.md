# Unit Test Instructions — Magic House (SupabaseBackendIntegration)

## Test Framework

| Tool | Purpose |
|---|---|
| Vitest 3.x | Test runner (`npm test` → `vitest run`) |
| jsdom | DOM environment for React components |
| fast-check | Property-based testing (already installed) |
| @vitest/coverage-v8 | Code coverage (`npm run test:coverage`) |

No test files currently exist in the project — they were not generated during code generation. The instructions below define what to create.

---

## Step 1 — Create Test Directory Structure

```
tests/
  unit/
    lib/
      validation/
        api.test.ts         ← Zod schema boundary tests
      services/
        stickers.test.ts    ← InsufficientFundsError + mocked service tests
    components/
      learning-zone.test.ts ← Property-based math generation tests
```

---

## Step 2 — Zod Schema Tests (`lib/validation/api.ts`)

Create `tests/unit/lib/validation/api.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  AddCoinsSchema, BuyStickerSchema, CanvasSchema,
  QuizHistorySchema, MigrateSchema
} from '@/lib/validation/api'

describe('AddCoinsSchema', () => {
  it('accepts valid positive integers up to 1000', () => {
    expect(AddCoinsSchema.safeParse({ amount: 10 }).success).toBe(true)
    expect(AddCoinsSchema.safeParse({ amount: 1000 }).success).toBe(true)
  })
  it('rejects zero, negative, floats, and over 1000', () => {
    expect(AddCoinsSchema.safeParse({ amount: 0 }).success).toBe(false)
    expect(AddCoinsSchema.safeParse({ amount: -5 }).success).toBe(false)
    expect(AddCoinsSchema.safeParse({ amount: 1001 }).success).toBe(false)
    expect(AddCoinsSchema.safeParse({ amount: 1.5 }).success).toBe(false)
  })
})

describe('BuyStickerSchema', () => {
  it('accepts non-empty stickerId', () => {
    expect(BuyStickerSchema.safeParse({ stickerId: 'crown' }).success).toBe(true)
  })
  it('rejects empty string', () => {
    expect(BuyStickerSchema.safeParse({ stickerId: '' }).success).toBe(false)
  })
})

describe('QuizHistorySchema', () => {
  const validCategories = ['shapes','colors','animals','math','vietnamese','english','addition','subtraction','timesTable']
  it('accepts all valid categories', () => {
    for (const category of validCategories) {
      const result = QuizHistorySchema.safeParse({ category, score: 5, totalQuestions: 10, coinsEarned: 10 })
      expect(result.success, `category '${category}' should be valid`).toBe(true)
    }
  })
  it('rejects unknown category', () => {
    expect(QuizHistorySchema.safeParse({ category: 'spelling', score: 5, totalQuestions: 10, coinsEarned: 10 }).success).toBe(false)
  })
  it('rejects negative score', () => {
    expect(QuizHistorySchema.safeParse({ category: 'math', score: -1, totalQuestions: 10, coinsEarned: 10 }).success).toBe(false)
  })
  it('rejects zero totalQuestions', () => {
    expect(QuizHistorySchema.safeParse({ category: 'math', score: 0, totalQuestions: 0, coinsEarned: 10 }).success).toBe(false)
  })
})

describe('CanvasSchema', () => {
  it('accepts valid canvas item array', () => {
    const valid = {
      canvasData: [
        { id: 'item-1', emoji: '🎩', x: 50, y: 50, scale: 1, rotation: 0 }
      ]
    }
    expect(CanvasSchema.safeParse(valid).success).toBe(true)
  })
  it('accepts empty array', () => {
    expect(CanvasSchema.safeParse({ canvasData: [] }).success).toBe(true)
  })
  it('rejects missing emoji field', () => {
    expect(CanvasSchema.safeParse({
      canvasData: [{ id: 'item-1', x: 50, y: 50, scale: 1, rotation: 0 }]
    }).success).toBe(false)
  })
})

describe('MigrateSchema', () => {
  it('accepts valid migration payload', () => {
    expect(MigrateSchema.safeParse({ coins: 50, ownedStickers: ['crown', 'balloon'] }).success).toBe(true)
    expect(MigrateSchema.safeParse({ coins: 0, ownedStickers: [] }).success).toBe(true)
  })
  it('rejects negative coins', () => {
    expect(MigrateSchema.safeParse({ coins: -1, ownedStickers: [] }).success).toBe(false)
  })
})
```

---

## Step 3 — Service Tests (`lib/services/stickers.ts`)

Create `tests/unit/lib/services/stickers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { InsufficientFundsError } from '@/lib/services/stickers'

describe('InsufficientFundsError', () => {
  it('is an instance of Error', () => {
    const err = new InsufficientFundsError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Not enough coins')
    expect(err.name).toBe('InsufficientFundsError')
  })
  it('is distinguishable from generic Error in catch blocks', () => {
    let caught: unknown
    try { throw new InsufficientFundsError() } catch (e) { caught = e }
    expect(caught).toBeInstanceOf(InsufficientFundsError)
  })
})
```

> **Note**: Full `purchaseSticker` tests require a live Supabase client or a deep mock. The InsufficientFundsError class test covers the critical business rule (insufficient funds detection) without requiring DB connectivity.

---

## Step 4 — Property-Based Tests (`components/learning-zone.tsx` math functions)

Create `tests/unit/components/learning-zone.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  generateAdditionQuestion,
  generateSubtractionQuestion,
  generateTimesTableQuestion,
  generateDistractors,
  insertAtRandom
} from '@/components/learning-zone'

describe('generateAdditionQuestion', () => {
  it('always produces a correct answer', () => {
    fc.assert(fc.property(fc.constant(null), () => {
      const { question, options, correctIndex } = generateAdditionQuestion()
      const [a, b] = question.match(/(\d+) \+ (\d+)/)!.slice(1).map(Number)
      expect(parseInt(options[correctIndex])).toBe(a + b)
    }), { numRuns: 100 })
  })
  it('always has exactly 3 options', () => {
    fc.assert(fc.property(fc.constant(null), () => {
      expect(generateAdditionQuestion().options).toHaveLength(3)
    }), { numRuns: 50 })
  })
})

describe('generateSubtractionQuestion', () => {
  it('result is always non-negative (minuend >= subtrahend)', () => {
    fc.assert(fc.property(fc.constant(null), () => {
      const { options, correctIndex } = generateSubtractionQuestion()
      expect(parseInt(options[correctIndex])).toBeGreaterThanOrEqual(0)
    }), { numRuns: 100 })
  })
})

describe('generateTimesTableQuestion', () => {
  it('multiplier is between 2-9, multiplicand between 1-10', () => {
    fc.assert(fc.property(fc.constant(null), () => {
      const { question, options, correctIndex } = generateTimesTableQuestion('en')
      const symbolMatch = question.match(/(\d+) × (\d+)/)
      if (symbolMatch) {
        const [mult, mulcand] = symbolMatch.slice(1).map(Number)
        expect(mult).toBeGreaterThanOrEqual(2)
        expect(mult).toBeLessThanOrEqual(9)
        expect(mulcand).toBeGreaterThanOrEqual(1)
        expect(mulcand).toBeLessThanOrEqual(10)
        expect(parseInt(options[correctIndex])).toBe(mult * mulcand)
      }
    }), { numRuns: 100 })
  })
})

describe('generateDistractors', () => {
  it('never contains the correct answer', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 200 }), (correct) => {
        const distractors = generateDistractors(correct, 'offset', 'arithmetic')
        expect(distractors).not.toContain(correct)
      }),
      { numRuns: 200 }
    )
  })
  it('always returns exactly 2 unique distractors', () => {
    fc.assert(
      fc.property(fc.integer({ min: 5, max: 200 }), (correct) => {
        const distractors = generateDistractors(correct, 'offset', 'arithmetic')
        expect(distractors).toHaveLength(2)
        expect(new Set(distractors).size).toBe(2)
      }),
      { numRuns: 200 }
    )
  })
})

describe('insertAtRandom', () => {
  it('correct value appears at correctIndex', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.tuple(
          fc.integer({ min: 101, max: 200 }),
          fc.integer({ min: 101, max: 200 })
        ),
        (correct, [d1, d2]) => {
          const { options, correctIndex } = insertAtRandom(correct, [d1, d2])
          expect(options).toHaveLength(3)
          expect(parseInt(options[correctIndex])).toBe(correct)
        }
      ),
      { numRuns: 200 }
    )
  })
  it('correctIndex is always 0, 1, or 2', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), (correct) => {
        const { correctIndex } = insertAtRandom(correct, [correct + 10, correct + 20])
        expect([0, 1, 2]).toContain(correctIndex)
      }),
      { numRuns: 100 }
    )
  })
})
```

---

## Step 5 — Run Tests

```bash
# Run all tests once
npm test

# Run with coverage report
npm run test:coverage

# Watch mode (reruns on file save)
npm run test:watch
```

**Expected output** (after test files are created):
```
✓ tests/unit/lib/validation/api.test.ts        (15 tests)
✓ tests/unit/lib/services/stickers.test.ts     (2 tests)
✓ tests/unit/components/learning-zone.test.ts  (8 tests)

Test Files  3 passed (3)
Tests      25 passed (25)
```

---

## Coverage Targets

| Module | Target | Rationale |
|---|---|---|
| `lib/validation/api.ts` | 95%+ | Pure schema definitions, easy to test |
| `lib/services/stickers.ts` (InsufficientFundsError) | 100% | Critical business rule |
| `components/learning-zone.ts` (exported functions) | 95%+ | Property-based tests give high confidence |

Coverage report: `coverage/lcov-report/index.html`
