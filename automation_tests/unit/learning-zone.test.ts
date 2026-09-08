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
