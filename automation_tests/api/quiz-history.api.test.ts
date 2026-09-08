import { describe, test, expect } from "vitest"
import { QuizHistorySchema } from "@/lib/validation/api"

// ---------------------------------------------------------------------------
// QuizHistorySchema — validation layer for POST /api/quiz/history
// ---------------------------------------------------------------------------
// These tests target the Zod schema that guards the route. Every payload the
// route accepts or rejects passes through this schema first, so schema coverage
// is equivalent to API contract coverage without requiring a live server.
// ---------------------------------------------------------------------------

describe("POST /api/quiz/history — accepted categories", () => {
  const base = { score: 8, totalQuestions: 10, coinsEarned: 15 }

  const validCategories = [
    "shapes", "colors", "animals", "math", "vietnamese", "english",
    "addition", "subtraction", "timesTable",
    "grade2Vietnamese", "grade2English",
  ] as const

  for (const category of validCategories) {
    test(`accepts category "${category}"`, () => {
      const result = QuizHistorySchema.safeParse({ ...base, category })
      expect(result.success).toBe(true)
    })
  }
})

describe("POST /api/quiz/history — rejected categories", () => {
  const base = { score: 8, totalQuestions: 10, coinsEarned: 15 }

  test("rejects unknown category", () => {
    const result = QuizHistorySchema.safeParse({ ...base, category: "grade3Math" })
    expect(result.success).toBe(false)
  })

  test("rejects empty string category", () => {
    const result = QuizHistorySchema.safeParse({ ...base, category: "" })
    expect(result.success).toBe(false)
  })

  test("rejects missing category", () => {
    const result = QuizHistorySchema.safeParse({ ...base })
    expect(result.success).toBe(false)
  })
})

describe("POST /api/quiz/history — grade2Vietnamese contract", () => {
  test("accepts minimum valid payload", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2Vietnamese",
      score: 0,
      totalQuestions: 10,
      coinsEarned: 5,
    })
    expect(result.success).toBe(true)
  })

  test("accepts perfect score with max easy coins", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2Vietnamese",
      score: 10,
      totalQuestions: 10,
      coinsEarned: 10,
    })
    expect(result.success).toBe(true)
  })

  test("accepts medium/hard range coins", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2Vietnamese",
      score: 7,
      totalQuestions: 10,
      coinsEarned: 25,
    })
    expect(result.success).toBe(true)
  })

  test("rejects negative coinsEarned", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2Vietnamese",
      score: 5,
      totalQuestions: 10,
      coinsEarned: -1,
    })
    expect(result.success).toBe(false)
  })

  test("rejects zero totalQuestions", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2Vietnamese",
      score: 0,
      totalQuestions: 0,
      coinsEarned: 5,
    })
    expect(result.success).toBe(false)
  })

  test("rejects float score", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2Vietnamese",
      score: 7.5,
      totalQuestions: 10,
      coinsEarned: 15,
    })
    expect(result.success).toBe(false)
  })
})

describe("POST /api/quiz/history — grade2English contract", () => {
  test("accepts minimum valid payload", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2English",
      score: 0,
      totalQuestions: 10,
      coinsEarned: 5,
    })
    expect(result.success).toBe(true)
  })

  test("accepts max coins (30)", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2English",
      score: 9,
      totalQuestions: 10,
      coinsEarned: 30,
    })
    expect(result.success).toBe(true)
  })

  test("rejects negative score", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2English",
      score: -1,
      totalQuestions: 10,
      coinsEarned: 10,
    })
    expect(result.success).toBe(false)
  })

  test("rejects missing coinsEarned", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2English",
      score: 5,
      totalQuestions: 10,
    })
    expect(result.success).toBe(false)
  })
})
