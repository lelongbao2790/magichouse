import { describe, test, expect } from "vitest"
import { QuizHistorySchema } from "@/lib/validation/api"

// ---------------------------------------------------------------------------
// POST /api/quiz/history — validation layer tests
// Tests target the Zod schema that guards the route. Every payload the route
// accepts or rejects passes through this schema first, so schema coverage is
// equivalent to API contract coverage without requiring a live server.
// ---------------------------------------------------------------------------

describe("POST /api/quiz/history — accepted categories", () => {
  const base = { score: 8, totalQuestions: 10, coinsEarned: 15 }

  test("TC-A001 | Accepts legacy preschool category: shapes", () => {
    expect(QuizHistorySchema.safeParse({ ...base, category: "shapes" }).success).toBe(true)
  })

  test("TC-A002 | Accepts legacy preschool category: colors", () => {
    expect(QuizHistorySchema.safeParse({ ...base, category: "colors" }).success).toBe(true)
  })

  test("TC-A003 | Accepts legacy preschool category: animals", () => {
    expect(QuizHistorySchema.safeParse({ ...base, category: "animals" }).success).toBe(true)
  })

  test("TC-A004 | Accepts legacy preschool category: math", () => {
    expect(QuizHistorySchema.safeParse({ ...base, category: "math" }).success).toBe(true)
  })

  test("TC-A005 | Accepts legacy preschool category: vietnamese", () => {
    expect(QuizHistorySchema.safeParse({ ...base, category: "vietnamese" }).success).toBe(true)
  })

  test("TC-A006 | Accepts legacy preschool category: english", () => {
    expect(QuizHistorySchema.safeParse({ ...base, category: "english" }).success).toBe(true)
  })

  test("TC-A007 | Accepts grade 1 category: addition", () => {
    expect(QuizHistorySchema.safeParse({ ...base, category: "addition" }).success).toBe(true)
  })

  test("TC-A008 | Accepts grade 1 category: subtraction", () => {
    expect(QuizHistorySchema.safeParse({ ...base, category: "subtraction" }).success).toBe(true)
  })

  test("TC-A009 | Accepts grade 1 category: timesTable", () => {
    expect(QuizHistorySchema.safeParse({ ...base, category: "timesTable" }).success).toBe(true)
  })

  test("TC-A010 | Accepts new grade 2 category: grade2Vietnamese", () => {
    expect(QuizHistorySchema.safeParse({ ...base, category: "grade2Vietnamese" }).success).toBe(true)
  })

  test("TC-A011 | Accepts new grade 2 category: grade2English", () => {
    expect(QuizHistorySchema.safeParse({ ...base, category: "grade2English" }).success).toBe(true)
  })
})

describe("POST /api/quiz/history — rejected categories", () => {
  const base = { score: 8, totalQuestions: 10, coinsEarned: 15 }

  test("TC-A012 | Rejects unknown category not in the allowed list", () => {
    expect(QuizHistorySchema.safeParse({ ...base, category: "grade3Math" }).success).toBe(false)
  })

  test("TC-A013 | Rejects empty string as category", () => {
    expect(QuizHistorySchema.safeParse({ ...base, category: "" }).success).toBe(false)
  })

  test("TC-A014 | Rejects payload with missing category field", () => {
    expect(QuizHistorySchema.safeParse({ ...base }).success).toBe(false)
  })
})

describe("POST /api/quiz/history — grade2Vietnamese contract", () => {
  test("TC-A015 | grade2Vietnamese: accepts minimum valid payload (score=0, coins=5)", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2Vietnamese",
      score: 0,
      totalQuestions: 10,
      coinsEarned: 5,
    })
    expect(result.success).toBe(true)
  })

  test("TC-A016 | grade2Vietnamese: accepts perfect score with maximum easy coins (10)", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2Vietnamese",
      score: 10,
      totalQuestions: 10,
      coinsEarned: 10,
    })
    expect(result.success).toBe(true)
  })

  test("TC-A017 | grade2Vietnamese: accepts medium/hard coin reward in range [10, 30]", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2Vietnamese",
      score: 7,
      totalQuestions: 10,
      coinsEarned: 25,
    })
    expect(result.success).toBe(true)
  })

  test("TC-A018 | grade2Vietnamese: rejects negative coinsEarned value", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2Vietnamese",
      score: 5,
      totalQuestions: 10,
      coinsEarned: -1,
    })
    expect(result.success).toBe(false)
  })

  test("TC-A019 | grade2Vietnamese: rejects zero as totalQuestions", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2Vietnamese",
      score: 0,
      totalQuestions: 0,
      coinsEarned: 5,
    })
    expect(result.success).toBe(false)
  })

  test("TC-A020 | grade2Vietnamese: rejects float value for score", () => {
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
  test("TC-A021 | grade2English: accepts minimum valid payload (score=0, coins=5)", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2English",
      score: 0,
      totalQuestions: 10,
      coinsEarned: 5,
    })
    expect(result.success).toBe(true)
  })

  test("TC-A022 | grade2English: accepts maximum possible coin reward (30)", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2English",
      score: 9,
      totalQuestions: 10,
      coinsEarned: 30,
    })
    expect(result.success).toBe(true)
  })

  test("TC-A023 | grade2English: rejects negative score value", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2English",
      score: -1,
      totalQuestions: 10,
      coinsEarned: 10,
    })
    expect(result.success).toBe(false)
  })

  test("TC-A024 | grade2English: rejects payload with missing coinsEarned field", () => {
    const result = QuizHistorySchema.safeParse({
      category: "grade2English",
      score: 5,
      totalQuestions: 10,
    })
    expect(result.success).toBe(false)
  })
})
