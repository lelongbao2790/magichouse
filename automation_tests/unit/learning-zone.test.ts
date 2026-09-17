import { describe, test, expect } from "vitest"
import {
  generateAdditionQuestion,
  generateSubtractionQuestion,
  generateTimesTableQuestion,
  generateDistractors,
  insertAtRandom,
} from "@/components/learning-zone"

// ── generateAdditionQuestion ─────────────────────────────────────────────────

describe("generateAdditionQuestion — boundaries", () => {
  test("TC-U031 | Addition question has correct format (a + b = ?)", () => {
    const { question, options, correctIndex } = generateAdditionQuestion()
    expect(question).toMatch(/^\d+ \+ \d+ = \?$/)
    expect(options).toHaveLength(3)
    expect(correctIndex).toBeGreaterThanOrEqual(0)
    expect(correctIndex).toBeLessThanOrEqual(2)
    const [a, b] = question.match(/\d+/g)!.map(Number)
    expect(Number(options[correctIndex])).toBe(a + b)
  })

  test("TC-U032 | Addition max operands (100 + 100 = 200) produce the correct answer", () => {
    let found = false
    for (let i = 0; i < 1000 && !found; i++) {
      const { question, options, correctIndex } = generateAdditionQuestion()
      const [a, b] = question.match(/\d+/g)!.map(Number)
      if (a === 100 && b === 100) {
        expect(Number(options[correctIndex])).toBe(200)
        found = true
      }
    }
  })
})

// ── generateSubtractionQuestion ──────────────────────────────────────────────

describe("generateSubtractionQuestion — boundaries", () => {
  test("TC-U033 | Subtraction question has correct format and minuend >= subtrahend", () => {
    const { question, options, correctIndex } = generateSubtractionQuestion()
    expect(question).toMatch(/^\d+ - \d+ = \?$/)
    expect(options).toHaveLength(3)
    const [minuend, subtrahend] = question.match(/\d+/g)!.map(Number)
    expect(minuend).toBeGreaterThanOrEqual(subtrahend)
    expect(Number(options[correctIndex])).toBe(minuend - subtrahend)
  })

  test("TC-U034 | Subtraction with equal operands produces result of zero", () => {
    let found = false
    for (let i = 0; i < 1000 && !found; i++) {
      const { question, options, correctIndex } = generateSubtractionQuestion()
      const [minuend, subtrahend] = question.match(/\d+/g)!.map(Number)
      if (minuend === subtrahend) {
        expect(Number(options[correctIndex])).toBe(0)
        found = true
      }
    }
  })

  test("TC-U035 | Subtraction correct answer is always non-negative", () => {
    for (let i = 0; i < 50; i++) {
      const { options, correctIndex } = generateSubtractionQuestion()
      expect(Number(options[correctIndex])).toBeGreaterThanOrEqual(0)
    }
  })
})

// ── generateTimesTableQuestion ───────────────────────────────────────────────

describe("generateTimesTableQuestion — boundaries", () => {
  test("TC-U036 | Times table smallest product (2 × 1 = 2) produces correct answer", () => {
    let found = false
    for (let i = 0; i < 2000 && !found; i++) {
      const { question, options, correctIndex } = generateTimesTableQuestion("en")
      if (question === "2 × 1 = ?" || question === "2 times 1 equals?") {
        expect(Number(options[correctIndex])).toBe(2)
        found = true
      }
    }
  })

  test("TC-U037 | Times table largest product (9 × 10 = 90) produces correct answer", () => {
    let found = false
    for (let i = 0; i < 2000 && !found; i++) {
      const { question, options, correctIndex } = generateTimesTableQuestion("en")
      if (question === "9 × 10 = ?" || question === "9 times 10 equals?") {
        expect(Number(options[correctIndex])).toBe(90)
        found = true
      }
    }
  })

  test("TC-U038 | Times table symbol-format question contains × character", () => {
    let found = false
    for (let i = 0; i < 200 && !found; i++) {
      const { question } = generateTimesTableQuestion("en")
      if (question.includes("×")) {
        expect(question).toMatch(/\d+ × \d+ = \?/)
        found = true
      }
    }
    expect(found).toBe(true)
  })

  test("TC-U039 | Times table word-format in Vietnamese contains nhân and bằng mấy", () => {
    let found = false
    for (let i = 0; i < 200 && !found; i++) {
      const { question } = generateTimesTableQuestion("vi")
      if (!question.includes("×")) {
        expect(question).toContain("nhân")
        expect(question).toContain("bằng mấy")
        found = true
      }
    }
    expect(found).toBe(true)
  })

  test("TC-U040 | Times table word-format in English contains times and equals", () => {
    let found = false
    for (let i = 0; i < 200 && !found; i++) {
      const { question } = generateTimesTableQuestion("en")
      if (!question.includes("×")) {
        expect(question).toContain("times")
        expect(question).toContain("equals")
        found = true
      }
    }
    expect(found).toBe(true)
  })
})

// ── MH-7 regression: difficulty must reflect actual question operands ─────────
// Before this fix, difficulty was randomly assigned via randomDifficulty(),
// causing calculateSessionCoins to produce unpredictable coin awards.

describe("generateAdditionQuestion — MH-7 difficulty regression", () => {
  test("TC-U031b | Addition difficulty is easy when both operands <= 10", () => {
    let found = false
    for (let i = 0; i < 5000 && !found; i++) {
      const { question, difficulty } = generateAdditionQuestion()
      const [a, b] = question.match(/\d+/g)!.map(Number)
      if (a <= 10 && b <= 10) {
        expect(difficulty).toBe('easy')
        found = true
      }
    }
    expect(found).toBe(true)
  })

  test("TC-U031c | Addition difficulty is hard when max operand > 50", () => {
    let found = false
    for (let i = 0; i < 5000 && !found; i++) {
      const { question, difficulty } = generateAdditionQuestion()
      const [a, b] = question.match(/\d+/g)!.map(Number)
      if (Math.max(a, b) > 50) {
        expect(difficulty).toBe('hard')
        found = true
      }
    }
    expect(found).toBe(true)
  })
})

describe("generateSubtractionQuestion — MH-7 difficulty regression", () => {
  test("TC-U033b | Subtraction difficulty is easy when minuend <= 10", () => {
    let found = false
    for (let i = 0; i < 5000 && !found; i++) {
      const { question, difficulty } = generateSubtractionQuestion()
      const [minuend] = question.match(/\d+/g)!.map(Number)
      if (minuend <= 10) {
        expect(difficulty).toBe('easy')
        found = true
      }
    }
    expect(found).toBe(true)
  })

  test("TC-U033c | Subtraction difficulty is hard when minuend > 50", () => {
    let found = false
    for (let i = 0; i < 5000 && !found; i++) {
      const { question, difficulty } = generateSubtractionQuestion()
      const [minuend] = question.match(/\d+/g)!.map(Number)
      if (minuend > 50) {
        expect(difficulty).toBe('hard')
        found = true
      }
    }
    expect(found).toBe(true)
  })
})

describe("generateTimesTableQuestion — MH-7 difficulty regression", () => {
  test("TC-U036b | Times table difficulty is easy for multiplier <= 3", () => {
    let found = false
    for (let i = 0; i < 5000 && !found; i++) {
      const { question, difficulty } = generateTimesTableQuestion("en")
      const nums = question.match(/\d+/g)!.map(Number)
      const multiplier = nums[0]
      if (multiplier <= 3) {
        expect(difficulty).toBe('easy')
        found = true
      }
    }
    expect(found).toBe(true)
  })

  test("TC-U036c | Times table difficulty is hard for multiplier > 6", () => {
    let found = false
    for (let i = 0; i < 5000 && !found; i++) {
      const { question, difficulty } = generateTimesTableQuestion("en")
      const nums = question.match(/\d+/g)!.map(Number)
      const multiplier = nums[0]
      if (multiplier > 6) {
        expect(difficulty).toBe('hard')
        found = true
      }
    }
    expect(found).toBe(true)
  })
})

// ── generateDistractors ───────────────────────────────────────────────────────

describe("generateDistractors — contract", () => {
  test("TC-U041 | generateDistractors never includes the correct answer in distractors", () => {
    const cases: Array<[number, "offset" | "adjacent", "arithmetic" | "multiply"]> = [
      [50, "offset", "arithmetic"],
      [10, "adjacent", "arithmetic"],
      [0, "offset", "arithmetic"],
      [200, "adjacent", "arithmetic"],
    ]
    for (const [correct, strategy, context] of cases) {
      const distractors = generateDistractors(correct, strategy, context)
      expect(distractors).toHaveLength(2)
      expect(distractors).not.toContain(correct)
      expect(distractors.every(d => d >= 0)).toBe(true)
    }
  })
})

// ── insertAtRandom ───────────────────────────────────────────────────────────

describe("insertAtRandom — position coverage", () => {
  test("TC-U042 | insertAtRandom produces exactly 3 options with correct value at correctIndex", () => {
    const { options, correctIndex } = insertAtRandom(42, [10, 20])
    expect(options).toHaveLength(3)
    expect(options[correctIndex]).toBe("42")
  })

  test("TC-U043 | insertAtRandom correct answer can be placed at index 0", () => {
    let found = false
    for (let i = 0; i < 100 && !found; i++) {
      const { correctIndex } = insertAtRandom(5, [1, 2])
      if (correctIndex === 0) found = true
    }
    expect(found).toBe(true)
  })

  test("TC-U044 | insertAtRandom correct answer can be placed at index 2", () => {
    let found = false
    for (let i = 0; i < 100 && !found; i++) {
      const { correctIndex } = insertAtRandom(5, [1, 2])
      if (correctIndex === 2) found = true
    }
    expect(found).toBe(true)
  })
})
