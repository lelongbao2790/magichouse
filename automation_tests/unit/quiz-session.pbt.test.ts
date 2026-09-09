import { describe, test } from "vitest"
import * as fc from "fast-check"
import { pickSessionQuestions, type Rng } from "@/lib/quiz-session"
import type { QuestionDto } from "@/lib/subject-content/types"

const PBT_OPTS = { verbose: true, numRuns: 300 } as const

const questionDtoArb: fc.Arbitrary<QuestionDto> = fc.record({
  id: fc.uuid(),
  question: fc.string({ minLength: 1 }),
  options: fc.tuple(
    fc.string({ minLength: 1 }),
    fc.string({ minLength: 1 }),
    fc.string({ minLength: 1 }),
  ),
  correctIndex: fc.integer({ min: 0, max: 2 }),
  difficulty: fc.constantFrom("easy" as const, "medium" as const, "hard" as const),
})

// Unique ids so "no duplicate" is meaningful.
const poolArb: fc.Arbitrary<QuestionDto[]> = fc
  .uniqueArray(questionDtoArb, { minLength: 0, maxLength: 120, selector: (q) => q.id })

const nArb = fc.integer({ min: 0, max: 30 })

function lcgFrom(seed: number): Rng {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}
const rngArb = fc.integer().map(lcgFrom)

describe("pickSessionQuestions — PBT-A", () => {
  test("TC-U099 | [PBT] result length === min(n, pool.length) (TP-A1)", () => {
    fc.assert(
      fc.property(poolArb, nArb, rngArb, (pool, n, rng) => {
        return pickSessionQuestions(pool, n, rng).length === Math.min(Math.max(n, 0), pool.length)
      }),
      PBT_OPTS,
    )
  })

  test("TC-U100 | [PBT] every result item is a member of the pool (TP-A2)", () => {
    fc.assert(
      fc.property(poolArb, nArb, rngArb, (pool, n, rng) => {
        const ids = new Set(pool.map((q) => q.id))
        return pickSessionQuestions(pool, n, rng).every((q) => ids.has(q.id))
      }),
      PBT_OPTS,
    )
  })

  test("TC-U101 | [PBT] no duplicate ids in the result (TP-A3)", () => {
    fc.assert(
      fc.property(poolArb, nArb, rngArb, (pool, n, rng) => {
        const res = pickSessionQuestions(pool, n, rng)
        return new Set(res.map((q) => q.id)).size === res.length
      }),
      PBT_OPTS,
    )
  })

  test("TC-U102 | [PBT] items pass through unmutated: 3 options, correctIndex in 0..2 (TP-A4)", () => {
    fc.assert(
      fc.property(poolArb, nArb, rngArb, (pool, n, rng) => {
        return pickSessionQuestions(pool, n, rng).every(
          (q) => q.options.length === 3 && q.correctIndex >= 0 && q.correctIndex <= 2,
        )
      }),
      PBT_OPTS,
    )
  })

  test("TC-U103 | [PBT] exact difficulty histogram when every bucket is rich enough (TP-A5)", () => {
    // build a pool guaranteed to have >= 12 of each difficulty, n = 10
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const rng = lcgFrom(seed)
        const pool: QuestionDto[] = []
        for (const d of ["easy", "medium", "hard"] as const)
          for (let i = 0; i < 12; i++)
            pool.push({ id: `${d}-${i}`, question: "q", options: ["a", "b", "c"], correctIndex: 0, difficulty: d })
        const res = pickSessionQuestions(pool, 10, rng)
        const h = res.reduce(
          (acc, q) => ((acc[q.difficulty] = (acc[q.difficulty] ?? 0) + 1), acc),
          {} as Record<string, number>,
        )
        return h.easy === 4 && h.medium === 4 && h.hard === 2 && res.length === 10
      }),
      PBT_OPTS,
    )
  })

  test("TC-U104 | [PBT] deterministic for a fixed seed (TP-A6)", () => {
    fc.assert(
      fc.property(poolArb, nArb, fc.integer(), (pool, n, seed) => {
        const a = pickSessionQuestions(pool, n, lcgFrom(seed))
        const b = pickSessionQuestions(pool, n, lcgFrom(seed))
        return JSON.stringify(a.map((q) => q.id)) === JSON.stringify(b.map((q) => q.id))
      }),
      PBT_OPTS,
    )
  })
})
