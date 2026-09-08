import { describe, test, expect } from "vitest"
import * as fc from "fast-check"
import { randomDifficulty, dominantDifficulty, calculateSessionCoins, type Difficulty } from "@/lib/coin-rewards"

const PBT_OPTS = { verbose: true, numRuns: 200 } as const
const difficultyArb = fc.constantFrom<Difficulty>('easy', 'medium', 'hard')
const difficultiesArb = fc.array(difficultyArb)

// ── randomDifficulty ─────────────────────────────────────────────────────────

describe("randomDifficulty", () => {
  test("TC-U001 | randomDifficulty always returns a valid difficulty value", () => {
    const valid = new Set<string>(['easy', 'medium', 'hard'])
    for (let i = 0; i < 300; i++) {
      expect(valid.has(randomDifficulty())).toBe(true)
    }
  })

  test("TC-U002 | randomDifficulty produces all three difficulty values across 300 samples", () => {
    const seen = new Set<string>()
    for (let i = 0; i < 300; i++) seen.add(randomDifficulty())
    expect(seen.has('easy')).toBe(true)
    expect(seen.has('medium')).toBe(true)
    expect(seen.has('hard')).toBe(true)
  })
})

// ── dominantDifficulty — deterministic ──────────────────────────────────────

describe("dominantDifficulty — deterministic", () => {
  test("TC-U003 | dominantDifficulty returns easy for empty array", () => {
    expect(dominantDifficulty([])).toBe('easy')
  })

  test("TC-U004 | dominantDifficulty returns easy for single easy input", () => {
    expect(dominantDifficulty(['easy'])).toBe('easy')
  })

  test("TC-U005 | dominantDifficulty returns medium for single medium input", () => {
    expect(dominantDifficulty(['medium'])).toBe('medium')
  })

  test("TC-U006 | dominantDifficulty returns hard for single hard input", () => {
    expect(dominantDifficulty(['hard'])).toBe('hard')
  })

  test("TC-U007 | dominantDifficulty returns easy for all-easy array", () => {
    expect(dominantDifficulty(['easy', 'easy', 'easy'])).toBe('easy')
  })

  test("TC-U008 | dominantDifficulty hard wins on three-way tie", () => {
    expect(dominantDifficulty(['easy', 'medium', 'hard'])).toBe('hard')
  })

  test("TC-U009 | dominantDifficulty medium wins when medium count exceeds hard", () => {
    expect(dominantDifficulty(['easy', 'easy', 'medium', 'medium', 'hard'])).toBe('medium')
  })

  test("TC-U010 | dominantDifficulty hard wins when hard ties with easy", () => {
    expect(dominantDifficulty(['easy', 'hard', 'medium', 'hard', 'easy'])).toBe('hard')
  })

  test("TC-U011 | dominantDifficulty easy wins with no tie", () => {
    expect(dominantDifficulty(['easy', 'easy', 'medium'])).toBe('easy')
  })

  test("TC-U012 | dominantDifficulty medium wins on easy-medium count tie", () => {
    expect(dominantDifficulty(['easy', 'easy', 'medium', 'medium'])).toBe('medium')
  })
})

// ── dominantDifficulty — PBT ─────────────────────────────────────────────────

describe("dominantDifficulty — PBT", () => {
  test("TC-U013 | [PBT] dominantDifficulty output is always a valid difficulty (P-D1)", () => {
    const valid = new Set(['easy', 'medium', 'hard'])
    fc.assert(
      fc.property(difficultiesArb, (ds) => valid.has(dominantDifficulty(ds))),
      PBT_OPTS
    )
  })

  test("TC-U014 | [PBT] dominantDifficulty on empty array always returns easy (P-D2)", () => {
    fc.assert(
      fc.property(fc.constant([]), (ds: Difficulty[]) => dominantDifficulty(ds) === 'easy'),
      PBT_OPTS
    )
  })

  test("TC-U015 | [PBT] dominantDifficulty on singleton returns same difficulty (P-D3)", () => {
    fc.assert(
      fc.property(difficultyArb, (d) => dominantDifficulty([d]) === d),
      PBT_OPTS
    )
  })

  test("TC-U016 | [PBT] dominantDifficulty on uniform array returns that difficulty (P-D4)", () => {
    fc.assert(
      fc.property(
        difficultyArb,
        fc.integer({ min: 1, max: 20 }),
        (d, n) => dominantDifficulty(Array(n).fill(d)) === d
      ),
      PBT_OPTS
    )
  })

  test("TC-U017 | [PBT] dominantDifficulty returns hard when hard count is dominant (P-D5)", () => {
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

  test("TC-U018 | [PBT] dominantDifficulty returns medium when medium is dominant over easy (P-D6)", () => {
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

  test("TC-U019 | [PBT] adding hard items never downgrades a hard result (P-D7)", () => {
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

// ── calculateSessionCoins — deterministic ───────────────────────────────────

describe("calculateSessionCoins — deterministic", () => {
  const RUNS = 100

  test("TC-U020 | calculateSessionCoins on empty array returns value in [5, 10]", () => {
    for (let i = 0; i < RUNS; i++) {
      const coins = calculateSessionCoins([])
      expect(coins).toBeGreaterThanOrEqual(5)
      expect(coins).toBeLessThanOrEqual(10)
    }
  })

  test("TC-U021 | calculateSessionCoins on all-easy input returns value in [5, 10]", () => {
    for (let i = 0; i < RUNS; i++) {
      const coins = calculateSessionCoins(['easy', 'easy', 'easy'])
      expect(coins).toBeGreaterThanOrEqual(5)
      expect(coins).toBeLessThanOrEqual(10)
    }
  })

  test("TC-U022 | calculateSessionCoins on all-medium input returns value in [10, 30]", () => {
    for (let i = 0; i < RUNS; i++) {
      const coins = calculateSessionCoins(['medium', 'medium', 'medium'])
      expect(coins).toBeGreaterThanOrEqual(10)
      expect(coins).toBeLessThanOrEqual(30)
    }
  })

  test("TC-U023 | calculateSessionCoins on all-hard input returns value in [10, 30]", () => {
    for (let i = 0; i < RUNS; i++) {
      const coins = calculateSessionCoins(['hard', 'hard', 'hard'])
      expect(coins).toBeGreaterThanOrEqual(10)
      expect(coins).toBeLessThanOrEqual(30)
    }
  })
})

// ── calculateSessionCoins — PBT ──────────────────────────────────────────────

describe("calculateSessionCoins — PBT", () => {
  test("TC-U024 | [PBT] calculateSessionCoins always returns an integer (P-C1)", () => {
    fc.assert(
      fc.property(difficultiesArb, (ds) => Number.isInteger(calculateSessionCoins(ds))),
      PBT_OPTS
    )
  })

  test("TC-U025 | [PBT] calculateSessionCoins always returns at least 5 coins (P-C2)", () => {
    fc.assert(
      fc.property(difficultiesArb, (ds) => calculateSessionCoins(ds) >= 5),
      PBT_OPTS
    )
  })

  test("TC-U026 | [PBT] calculateSessionCoins always returns at most 30 coins (P-C3)", () => {
    fc.assert(
      fc.property(difficultiesArb, (ds) => calculateSessionCoins(ds) <= 30),
      PBT_OPTS
    )
  })

  test("TC-U027 | [PBT] calculateSessionCoins on empty array gives range [5, 10] (P-C4)", () => {
    fc.assert(
      fc.property(fc.constant([]), (ds: Difficulty[]) => {
        const coins = calculateSessionCoins(ds)
        return coins >= 5 && coins <= 10
      }),
      PBT_OPTS
    )
  })

  test("TC-U028 | [PBT] calculateSessionCoins on all-easy input gives range [5, 10] (P-C5)", () => {
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

  test("TC-U029 | [PBT] calculateSessionCoins on all-medium input gives range [10, 30] (P-C6)", () => {
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

  test("TC-U030 | [PBT] calculateSessionCoins on all-hard input gives range [10, 30] (P-C7)", () => {
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
