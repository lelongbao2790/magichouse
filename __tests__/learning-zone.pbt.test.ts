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

// --- generateAdditionQuestion ---

describe("generateAdditionQuestion", () => {
  test("ADD-P1: correct equals a + b", () => {
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

  test("ADD-P2: options always has exactly 3 elements", () => {
    fc.assert(
      fc.property(fc.constant(null), () => generateAdditionQuestion().options.length === 3),
      PBT_OPTS
    )
  })

  test("ADD-P3: options always contains the correct answer", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { options, correctIndex } = generateAdditionQuestion()
        return options.includes(options[correctIndex])
      }),
      PBT_OPTS
    )
  })

  test("ADD-P4: all three options are distinct", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { options } = generateAdditionQuestion()
        return new Set(options).size === 3
      }),
      PBT_OPTS
    )
  })
})

// --- generateSubtractionQuestion ---

describe("generateSubtractionQuestion", () => {
  test("SUB-P1: correct equals |a - b|", () => {
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

  test("SUB-P2: correct answer is always >= 0", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { options, correctIndex } = generateSubtractionQuestion()
        return Number(options[correctIndex]) >= 0
      }),
      PBT_OPTS
    )
  })

  test("SUB-P3: options always has exactly 3 elements", () => {
    fc.assert(
      fc.property(fc.constant(null), () => generateSubtractionQuestion().options.length === 3),
      PBT_OPTS
    )
  })

  test("SUB-P4: options always contains the correct answer", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { options, correctIndex } = generateSubtractionQuestion()
        return options.includes(options[correctIndex])
      }),
      PBT_OPTS
    )
  })
})

// --- generateTimesTableQuestion ---

describe("generateTimesTableQuestion", () => {
  const langArb = fc.constantFrom("vi" as const, "en" as const)

  test("TT-P1: correct equals multiplier × multiplicand", () => {
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

  test("TT-P2: correct answer is always >= 2", () => {
    fc.assert(
      fc.property(langArb, (lang) => {
        const { options, correctIndex } = generateTimesTableQuestion(lang)
        return Number(options[correctIndex]) >= 2
      }),
      PBT_OPTS
    )
  })

  test("TT-P3: correct answer is always <= 90", () => {
    fc.assert(
      fc.property(langArb, (lang) => {
        const { options, correctIndex } = generateTimesTableQuestion(lang)
        return Number(options[correctIndex]) <= 90
      }),
      PBT_OPTS
    )
  })

  test("TT-P4: options always has exactly 3 elements", () => {
    fc.assert(
      fc.property(langArb, (lang) => generateTimesTableQuestion(lang).options.length === 3),
      PBT_OPTS
    )
  })

  test("TT-P5: options always contains the correct answer", () => {
    fc.assert(
      fc.property(langArb, (lang) => {
        const { options, correctIndex } = generateTimesTableQuestion(lang)
        return options.includes(options[correctIndex])
      }),
      PBT_OPTS
    )
  })
})

// --- generateDistractors (arithmetic context) ---

describe("generateDistractors — arithmetic context", () => {
  const arithmeticArb = fc.record({
    correct: fc.integer({ min: 0, max: 200 }),
    strategy: fc.constantFrom("offset" as const, "adjacent" as const),
  })

  test("DR-P1: always returns exactly 2 distractors", () => {
    fc.assert(
      fc.property(arithmeticArb, ({ correct, strategy }) => {
        return generateDistractors(correct, strategy, "arithmetic").length === 2
      }),
      PBT_OPTS
    )
  })

  test("DR-P2: no distractor equals the correct answer", () => {
    fc.assert(
      fc.property(arithmeticArb, ({ correct, strategy }) => {
        return generateDistractors(correct, strategy, "arithmetic").every(d => d !== correct)
      }),
      PBT_OPTS
    )
  })

  test("DR-P3: both distractors are distinct", () => {
    fc.assert(
      fc.property(arithmeticArb, ({ correct, strategy }) => {
        const distractors = generateDistractors(correct, strategy, "arithmetic")
        return distractors[0] !== distractors[1]
      }),
      PBT_OPTS
    )
  })

  test("DR-P4: all distractors are >= 0", () => {
    fc.assert(
      fc.property(arithmeticArb, ({ correct, strategy }) => {
        return generateDistractors(correct, strategy, "arithmetic").every(d => d >= 0)
      }),
      PBT_OPTS
    )
  })
})

// --- generateDistractors (multiply context) ---

describe("generateDistractors — multiply context", () => {
  const multiplyArb = fc.record({
    multiplier: fc.integer({ min: 2, max: 9 }),
    multiplicand: fc.integer({ min: 1, max: 10 }),
    strategy: fc.constantFrom("offset" as const, "adjacent" as const),
  })

  test("DR-P1: always returns exactly 2 distractors", () => {
    fc.assert(
      fc.property(multiplyArb, ({ multiplier, multiplicand, strategy }) => {
        const correct = multiplier * multiplicand
        return generateDistractors(correct, strategy, "multiply", multiplier, multiplicand).length === 2
      }),
      PBT_OPTS
    )
  })

  test("DR-P2: no distractor equals the correct answer", () => {
    fc.assert(
      fc.property(multiplyArb, ({ multiplier, multiplicand, strategy }) => {
        const correct = multiplier * multiplicand
        return generateDistractors(correct, strategy, "multiply", multiplier, multiplicand).every(d => d !== correct)
      }),
      PBT_OPTS
    )
  })

  test("DR-P3: both distractors are distinct", () => {
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

// --- insertAtRandom ---

describe("insertAtRandom", () => {
  const insertArb = fc.record({
    correct: fc.integer({ min: 0, max: 200 }),
    d1: fc.integer({ min: 0, max: 200 }),
    d2: fc.integer({ min: 0, max: 200 }),
  })

  test("AP-P1: output always has exactly 3 options", () => {
    fc.assert(
      fc.property(insertArb, ({ correct, d1, d2 }) => {
        return insertAtRandom(correct, [d1, d2]).options.length === 3
      }),
      PBT_OPTS
    )
  })

  test("AP-P2: options[correctIndex] always equals correct", () => {
    fc.assert(
      fc.property(insertArb, ({ correct, d1, d2 }) => {
        const { options, correctIndex } = insertAtRandom(correct, [d1, d2])
        return options[correctIndex] === String(correct)
      }),
      PBT_OPTS
    )
  })

  test("AP-P3: output always contains both distractors", () => {
    fc.assert(
      fc.property(insertArb, ({ correct, d1, d2 }) => {
        const { options } = insertAtRandom(correct, [d1, d2])
        return options.includes(String(d1)) && options.includes(String(d2))
      }),
      PBT_OPTS
    )
  })

  test("AP-P4: correctIndex is always in {0, 1, 2}", () => {
    fc.assert(
      fc.property(insertArb, ({ correct, d1, d2 }) => {
        const { correctIndex } = insertAtRandom(correct, [d1, d2])
        return correctIndex >= 0 && correctIndex <= 2
      }),
      PBT_OPTS
    )
  })
})
