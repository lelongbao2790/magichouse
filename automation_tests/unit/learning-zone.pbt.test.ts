import { describe, test } from "vitest"
import * as fc from "fast-check"
import {
  generateAdditionQuestion,
  generateSubtractionQuestion,
  generateTimesTableQuestion,
  generateDistractors,
  insertAtRandom,
} from "@/components/learning-zone"

const PBT_OPTS = { verbose: true, numRuns: 100 } as const

// ── generateAdditionQuestion — PBT ───────────────────────────────────────────

describe("generateAdditionQuestion — PBT", () => {
  test("TC-U045 | [PBT] Addition correct answer always equals a + b (ADD-P1)", () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.integer({ min: 1, max: 100 }), fc.integer({ min: 1, max: 100 })),
        () => {
          const result = generateAdditionQuestion()
          const [a, b] = result.question.match(/\d+/g)!.map(Number)
          return result.options[result.correctIndex] === String(a + b)
        }
      ),
      PBT_OPTS
    )
  })

  test("TC-U046 | [PBT] Addition options array always has exactly 3 elements (ADD-P2)", () => {
    fc.assert(
      fc.property(fc.constant(null), () => generateAdditionQuestion().options.length === 3),
      PBT_OPTS
    )
  })

  test("TC-U047 | [PBT] Addition options always contain the correct answer (ADD-P3)", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { options, correctIndex } = generateAdditionQuestion()
        return options.includes(options[correctIndex])
      }),
      PBT_OPTS
    )
  })

  test("TC-U048 | [PBT] Addition all three answer options are distinct (ADD-P4)", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { options } = generateAdditionQuestion()
        return new Set(options).size === 3
      }),
      PBT_OPTS
    )
  })
})

// ── generateSubtractionQuestion — PBT ────────────────────────────────────────

describe("generateSubtractionQuestion — PBT", () => {
  test("TC-U049 | [PBT] Subtraction correct answer always equals |a - b| (SUB-P1)", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const result = generateSubtractionQuestion()
        const nums = result.question.match(/\d+/g)!.map(Number)
        const expected = Math.abs(nums[0] - nums[1])
        return result.options[result.correctIndex] === String(expected)
      }),
      PBT_OPTS
    )
  })

  test("TC-U050 | [PBT] Subtraction correct answer is always >= 0 (SUB-P2)", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { options, correctIndex } = generateSubtractionQuestion()
        return Number(options[correctIndex]) >= 0
      }),
      PBT_OPTS
    )
  })

  test("TC-U051 | [PBT] Subtraction options array always has exactly 3 elements (SUB-P3)", () => {
    fc.assert(
      fc.property(fc.constant(null), () => generateSubtractionQuestion().options.length === 3),
      PBT_OPTS
    )
  })

  test("TC-U052 | [PBT] Subtraction options always contain the correct answer (SUB-P4)", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { options, correctIndex } = generateSubtractionQuestion()
        return options.includes(options[correctIndex])
      }),
      PBT_OPTS
    )
  })
})

// ── generateTimesTableQuestion — PBT ─────────────────────────────────────────

describe("generateTimesTableQuestion — PBT", () => {
  const langArb = fc.constantFrom("vi" as const, "en" as const)

  test("TC-U053 | [PBT] Times table correct answer always equals multiplier × multiplicand (TT-P1)", () => {
    fc.assert(
      fc.property(langArb, (lang) => {
        const result = generateTimesTableQuestion(lang)
        const nums = result.question.match(/\d+/g)!.map(Number)
        const correct = Number(result.options[result.correctIndex])
        return correct === nums[0] * nums[1]
      }),
      PBT_OPTS
    )
  })

  test("TC-U054 | [PBT] Times table correct answer is always >= 2 (TT-P2)", () => {
    fc.assert(
      fc.property(langArb, (lang) => {
        const { options, correctIndex } = generateTimesTableQuestion(lang)
        return Number(options[correctIndex]) >= 2
      }),
      PBT_OPTS
    )
  })

  test("TC-U055 | [PBT] Times table correct answer is always <= 90 (TT-P3)", () => {
    fc.assert(
      fc.property(langArb, (lang) => {
        const { options, correctIndex } = generateTimesTableQuestion(lang)
        return Number(options[correctIndex]) <= 90
      }),
      PBT_OPTS
    )
  })

  test("TC-U056 | [PBT] Times table options array always has exactly 3 elements (TT-P4)", () => {
    fc.assert(
      fc.property(langArb, (lang) => generateTimesTableQuestion(lang).options.length === 3),
      PBT_OPTS
    )
  })

  test("TC-U057 | [PBT] Times table options always contain the correct answer (TT-P5)", () => {
    fc.assert(
      fc.property(langArb, (lang) => {
        const { options, correctIndex } = generateTimesTableQuestion(lang)
        return options.includes(options[correctIndex])
      }),
      PBT_OPTS
    )
  })
})

// ── generateDistractors (arithmetic context) — PBT ───────────────────────────

describe("generateDistractors — arithmetic context PBT", () => {
  const arithmeticArb = fc.record({
    correct: fc.integer({ min: 0, max: 200 }),
    strategy: fc.constantFrom("offset" as const, "adjacent" as const),
  })

  test("TC-U058 | [PBT] Arithmetic distractors always returns exactly 2 values (DR-P1)", () => {
    fc.assert(
      fc.property(arithmeticArb, ({ correct, strategy }) => {
        return generateDistractors(correct, strategy, "arithmetic").length === 2
      }),
      PBT_OPTS
    )
  })

  test("TC-U059 | [PBT] Arithmetic distractor values never equal the correct answer (DR-P2)", () => {
    fc.assert(
      fc.property(arithmeticArb, ({ correct, strategy }) => {
        return generateDistractors(correct, strategy, "arithmetic").every(d => d !== correct)
      }),
      PBT_OPTS
    )
  })

  test("TC-U060 | [PBT] Both arithmetic distractors are always distinct from each other (DR-P3)", () => {
    fc.assert(
      fc.property(arithmeticArb, ({ correct, strategy }) => {
        const distractors = generateDistractors(correct, strategy, "arithmetic")
        return distractors[0] !== distractors[1]
      }),
      PBT_OPTS
    )
  })

  test("TC-U061 | [PBT] All arithmetic distractors are always >= 0 (DR-P4)", () => {
    fc.assert(
      fc.property(arithmeticArb, ({ correct, strategy }) => {
        return generateDistractors(correct, strategy, "arithmetic").every(d => d >= 0)
      }),
      PBT_OPTS
    )
  })
})

// ── generateDistractors (multiply context) — PBT ─────────────────────────────

describe("generateDistractors — multiply context PBT", () => {
  const multiplyArb = fc.record({
    multiplier: fc.integer({ min: 2, max: 9 }),
    multiplicand: fc.integer({ min: 1, max: 10 }),
    strategy: fc.constantFrom("offset" as const, "adjacent" as const),
  })

  test("TC-U062 | [PBT] Multiply distractors always returns exactly 2 values (DR-P1)", () => {
    fc.assert(
      fc.property(multiplyArb, ({ multiplier, multiplicand, strategy }) => {
        const correct = multiplier * multiplicand
        return generateDistractors(correct, strategy, "multiply", multiplier, multiplicand).length === 2
      }),
      PBT_OPTS
    )
  })

  test("TC-U063 | [PBT] Multiply distractor values never equal the correct answer (DR-P2)", () => {
    fc.assert(
      fc.property(multiplyArb, ({ multiplier, multiplicand, strategy }) => {
        const correct = multiplier * multiplicand
        return generateDistractors(correct, strategy, "multiply", multiplier, multiplicand).every(d => d !== correct)
      }),
      PBT_OPTS
    )
  })

  test("TC-U064 | [PBT] Both multiply distractors are always distinct from each other (DR-P3)", () => {
    fc.assert(
      fc.property(multiplyArb, ({ multiplier, multiplicand, strategy }) => {
        const correct = multiplier * multiplicand
        const distractors = generateDistractors(correct, strategy, "multiply", multiplier, multiplicand)
        return distractors[0] !== distractors[1]
      }),
      PBT_OPTS
    )
  })
})

// ── insertAtRandom — PBT ──────────────────────────────────────────────────────

describe("insertAtRandom — PBT", () => {
  const insertArb = fc.record({
    correct: fc.integer({ min: 0, max: 200 }),
    d1: fc.integer({ min: 0, max: 200 }),
    d2: fc.integer({ min: 0, max: 200 }),
  })

  test("TC-U065 | [PBT] insertAtRandom output always has exactly 3 options (AP-P1)", () => {
    fc.assert(
      fc.property(insertArb, ({ correct, d1, d2 }) => {
        return insertAtRandom(correct, [d1, d2]).options.length === 3
      }),
      PBT_OPTS
    )
  })

  test("TC-U066 | [PBT] insertAtRandom options[correctIndex] always equals correct value (AP-P2)", () => {
    fc.assert(
      fc.property(insertArb, ({ correct, d1, d2 }) => {
        const { options, correctIndex } = insertAtRandom(correct, [d1, d2])
        return options[correctIndex] === String(correct)
      }),
      PBT_OPTS
    )
  })

  test("TC-U067 | [PBT] insertAtRandom output always contains both distractor values (AP-P3)", () => {
    fc.assert(
      fc.property(insertArb, ({ correct, d1, d2 }) => {
        const { options } = insertAtRandom(correct, [d1, d2])
        return options.includes(String(d1)) && options.includes(String(d2))
      }),
      PBT_OPTS
    )
  })

  test("TC-U068 | [PBT] insertAtRandom correctIndex is always in {0, 1, 2} (AP-P4)", () => {
    fc.assert(
      fc.property(insertArb, ({ correct, d1, d2 }) => {
        const { correctIndex } = insertAtRandom(correct, [d1, d2])
        return correctIndex >= 0 && correctIndex <= 2
      }),
      PBT_OPTS
    )
  })
})
