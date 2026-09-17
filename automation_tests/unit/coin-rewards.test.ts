import { describe, test, expect } from "vitest"
import * as fc from "fast-check"
import { scoreDifficulty, timesTableDifficulty, dominantDifficulty, calculateSessionCoins, type Difficulty } from "@/lib/coin-rewards"

const PBT_OPTS = { verbose: true, numRuns: 200 } as const
const difficultyArb = fc.constantFrom<Difficulty>('easy', 'medium', 'hard')
const difficultiesArb = fc.array(difficultyArb)

// ── scoreDifficulty ──────────────────────────────────────────────────────────

describe("scoreDifficulty — deterministic from operand value", () => {
  test("TC-U001 | scoreDifficulty returns easy for operand <= 10", () => {
    expect(scoreDifficulty(0)).toBe('easy')
    expect(scoreDifficulty(1)).toBe('easy')
    expect(scoreDifficulty(10)).toBe('easy')
  })

  test("TC-U002 | scoreDifficulty returns medium for operand 11–50", () => {
    expect(scoreDifficulty(11)).toBe('medium')
    expect(scoreDifficulty(25)).toBe('medium')
    expect(scoreDifficulty(50)).toBe('medium')
  })

  test("TC-U002b | scoreDifficulty returns hard for operand > 50", () => {
    expect(scoreDifficulty(51)).toBe('hard')
    expect(scoreDifficulty(100)).toBe('hard')
  })
})

// ── timesTableDifficulty ─────────────────────────────────────────────────────

describe("timesTableDifficulty — deterministic from multiplier", () => {
  test("TC-U002c | timesTableDifficulty returns easy for multiplier <= 3", () => {
    expect(timesTableDifficulty(2)).toBe('easy')
    expect(timesTableDifficulty(3)).toBe('easy')
  })

  test("TC-U002d | timesTableDifficulty returns medium for multiplier 4–6", () => {
    expect(timesTableDifficulty(4)).toBe('medium')
    expect(timesTableDifficulty(6)).toBe('medium')
  })

  test("TC-U002e | timesTableDifficulty returns hard for multiplier > 6", () => {
    expect(timesTableDifficulty(7)).toBe('hard')
    expect(timesTableDifficulty(9)).toBe('hard')
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
  // MH-7 regression: coins must not be randomly generated; same input must always
  // yield the same output so the balance shown to the user is correct and stable.
  test("TC-U020 | calculateSessionCoins is pure: same input always returns the same value", () => {
    const inputs: Difficulty[][] = [[], ['easy'], ['medium'], ['hard'], ['easy', 'hard', 'hard']]
    for (const ds of inputs) {
      const first = calculateSessionCoins(ds)
      for (let i = 0; i < 20; i++) {
        expect(calculateSessionCoins(ds)).toBe(first)
      }
    }
  })

  test("TC-U021 | calculateSessionCoins on empty array (dominant=easy) returns 5", () => {
    expect(calculateSessionCoins([])).toBe(5)
  })

  test("TC-U022 | calculateSessionCoins on all-medium input returns 15", () => {
    expect(calculateSessionCoins(['medium', 'medium', 'medium'])).toBe(15)
  })

  test("TC-U023 | calculateSessionCoins on all-hard input returns 25", () => {
    expect(calculateSessionCoins(['hard', 'hard', 'hard'])).toBe(25)
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
