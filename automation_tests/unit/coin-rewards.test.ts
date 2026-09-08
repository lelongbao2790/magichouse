import { describe, test, expect } from "vitest"
import * as fc from "fast-check"
import { randomDifficulty, dominantDifficulty, calculateSessionCoins, type Difficulty } from "@/lib/coin-rewards"

const PBT_OPTS = { verbose: true, numRuns: 200 } as const
const difficultyArb = fc.constantFrom<Difficulty>('easy', 'medium', 'hard')
const difficultiesArb = fc.array(difficultyArb)

// --- randomDifficulty ---

describe("randomDifficulty", () => {
  test("always returns a valid Difficulty", () => {
    const valid = new Set<string>(['easy', 'medium', 'hard'])
    for (let i = 0; i < 300; i++) {
      expect(valid.has(randomDifficulty())).toBe(true)
    }
  })

  test("all three values occur in 300 samples", () => {
    const seen = new Set<string>()
    for (let i = 0; i < 300; i++) seen.add(randomDifficulty())
    expect(seen.has('easy')).toBe(true)
    expect(seen.has('medium')).toBe(true)
    expect(seen.has('hard')).toBe(true)
  })
})

// --- dominantDifficulty — deterministic cases ---

describe("dominantDifficulty — deterministic", () => {
  test("empty array returns 'easy'", () => {
    expect(dominantDifficulty([])).toBe('easy')
  })

  test("singleton ['easy'] returns 'easy'", () => {
    expect(dominantDifficulty(['easy'])).toBe('easy')
  })

  test("singleton ['medium'] returns 'medium'", () => {
    expect(dominantDifficulty(['medium'])).toBe('medium')
  })

  test("singleton ['hard'] returns 'hard'", () => {
    expect(dominantDifficulty(['hard'])).toBe('hard')
  })

  test("all-same ['easy','easy','easy'] returns 'easy'", () => {
    expect(dominantDifficulty(['easy', 'easy', 'easy'])).toBe('easy')
  })

  test("three-way tie ['easy','medium','hard'] — hard wins", () => {
    expect(dominantDifficulty(['easy', 'medium', 'hard'])).toBe('hard')
  })

  test("[easy×2, medium×2, hard×1] — medium wins (hard < medium)", () => {
    expect(dominantDifficulty(['easy', 'easy', 'medium', 'medium', 'hard'])).toBe('medium')
  })

  test("[easy×2, medium×1, hard×2] — hard wins (hard≥medium AND hard≥easy)", () => {
    expect(dominantDifficulty(['easy', 'hard', 'medium', 'hard', 'easy'])).toBe('hard')
  })

  test("[easy×2, medium×1] — easy wins (no tie)", () => {
    expect(dominantDifficulty(['easy', 'easy', 'medium'])).toBe('easy')
  })

  test("[easy×2, medium×2] — medium wins (tie, medium beats easy)", () => {
    expect(dominantDifficulty(['easy', 'easy', 'medium', 'medium'])).toBe('medium')
  })
})

// --- dominantDifficulty — PBT ---

describe("dominantDifficulty — PBT", () => {
  test("P-D1: output is always one of 'easy', 'medium', 'hard'", () => {
    const valid = new Set(['easy', 'medium', 'hard'])
    fc.assert(
      fc.property(difficultiesArb, (ds) => valid.has(dominantDifficulty(ds))),
      PBT_OPTS
    )
  })

  test("P-D2: empty array always returns 'easy'", () => {
    fc.assert(
      fc.property(fc.constant([]), (ds: Difficulty[]) => dominantDifficulty(ds) === 'easy'),
      PBT_OPTS
    )
  })

  test("P-D3: singleton returns the same difficulty", () => {
    fc.assert(
      fc.property(difficultyArb, (d) => dominantDifficulty([d]) === d),
      PBT_OPTS
    )
  })

  test("P-D4: all-same array returns that difficulty", () => {
    fc.assert(
      fc.property(
        difficultyArb,
        fc.integer({ min: 1, max: 20 }),
        (d, n) => dominantDifficulty(Array(n).fill(d)) === d
      ),
      PBT_OPTS
    )
  })

  test("P-D5: if hard count > 0 and hard >= medium and hard >= easy -> returns 'hard'", () => {
    fc.assert(
      fc.property(difficultiesArb, (ds) => {
        const counts = { easy: 0, medium: 0, hard: 0 }
        for (const d of ds) counts[d]++
        if (counts.hard > 0 && counts.hard >= counts.medium && counts.hard >= counts.easy) {
          return dominantDifficulty(ds) === 'hard'
        }
        return true
      }),
      PBT_OPTS
    )
  })

  test("P-D6: if hard is not dominant and medium count > 0 and medium >= easy -> returns 'medium'", () => {
    fc.assert(
      fc.property(difficultiesArb, (ds) => {
        const counts = { easy: 0, medium: 0, hard: 0 }
        for (const d of ds) counts[d]++
        const hardWins = counts.hard > 0 && counts.hard >= counts.medium && counts.hard >= counts.easy
        if (!hardWins && counts.medium > 0 && counts.medium >= counts.easy) {
          return dominantDifficulty(ds) === 'medium'
        }
        return true
      }),
      PBT_OPTS
    )
  })

  test("P-D7: adding 'hard' elements never changes result from 'hard' to something lower", () => {
    fc.assert(
      fc.property(
        difficultiesArb,
        fc.integer({ min: 1, max: 5 }),
        (ds, n) => {
          if (dominantDifficulty(ds) === 'hard') {
            return dominantDifficulty([...ds, ...Array(n).fill('hard')]) === 'hard'
          }
          return true
        }
      ),
      PBT_OPTS
    )
  })
})

// --- calculateSessionCoins — deterministic ---

describe("calculateSessionCoins — deterministic", () => {
  const RUNS = 100

  test("empty array -> result in [5, 10]", () => {
    for (let i = 0; i < RUNS; i++) {
      const coins = calculateSessionCoins([])
      expect(coins).toBeGreaterThanOrEqual(5)
      expect(coins).toBeLessThanOrEqual(10)
    }
  })

  test("all-easy -> result in [5, 10]", () => {
    for (let i = 0; i < RUNS; i++) {
      const coins = calculateSessionCoins(['easy', 'easy', 'easy'])
      expect(coins).toBeGreaterThanOrEqual(5)
      expect(coins).toBeLessThanOrEqual(10)
    }
  })

  test("all-medium -> result in [10, 30]", () => {
    for (let i = 0; i < RUNS; i++) {
      const coins = calculateSessionCoins(['medium', 'medium', 'medium'])
      expect(coins).toBeGreaterThanOrEqual(10)
      expect(coins).toBeLessThanOrEqual(30)
    }
  })

  test("all-hard -> result in [10, 30]", () => {
    for (let i = 0; i < RUNS; i++) {
      const coins = calculateSessionCoins(['hard', 'hard', 'hard'])
      expect(coins).toBeGreaterThanOrEqual(10)
      expect(coins).toBeLessThanOrEqual(30)
    }
  })
})

// --- calculateSessionCoins — PBT ---

describe("calculateSessionCoins — PBT", () => {
  test("P-C1: output is always an integer", () => {
    fc.assert(
      fc.property(difficultiesArb, (ds) => Number.isInteger(calculateSessionCoins(ds))),
      PBT_OPTS
    )
  })

  test("P-C2: output is always >= 5", () => {
    fc.assert(
      fc.property(difficultiesArb, (ds) => calculateSessionCoins(ds) >= 5),
      PBT_OPTS
    )
  })

  test("P-C3: output is always <= 30", () => {
    fc.assert(
      fc.property(difficultiesArb, (ds) => calculateSessionCoins(ds) <= 30),
      PBT_OPTS
    )
  })

  test("P-C4: empty array -> result in [5, 10]", () => {
    fc.assert(
      fc.property(fc.constant([]), (ds: Difficulty[]) => {
        const coins = calculateSessionCoins(ds)
        return coins >= 5 && coins <= 10
      }),
      PBT_OPTS
    )
  })

  test("P-C5: all-easy input -> result in [5, 10]", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 15 }),
        (n) => {
          const coins = calculateSessionCoins(Array(n).fill('easy'))
          return coins >= 5 && coins <= 10
        }
      ),
      PBT_OPTS
    )
  })

  test("P-C6: all-medium input -> result in [10, 30]", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 15 }),
        (n) => {
          const coins = calculateSessionCoins(Array(n).fill('medium'))
          return coins >= 10 && coins <= 30
        }
      ),
      PBT_OPTS
    )
  })

  test("P-C7: all-hard input -> result in [10, 30]", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 15 }),
        (n) => {
          const coins = calculateSessionCoins(Array(n).fill('hard'))
          return coins >= 10 && coins <= 30
        }
      ),
      PBT_OPTS
    )
  })
})
