import { describe, test, expect } from "vitest"
import { pickSessionQuestions, shuffle, type Rng } from "@/lib/quiz-session"
import type { QuestionDto, Difficulty } from "@/lib/subject-content/types"

function q(id: string, difficulty: Difficulty): QuestionDto {
  return { id, question: `q${id}`, options: ["a", "b", "c"], correctIndex: 0, difficulty }
}

function pool(easy: number, medium: number, hard: number): QuestionDto[] {
  const out: QuestionDto[] = []
  for (let i = 0; i < easy; i++) out.push(q(`e${i}`, "easy"))
  for (let i = 0; i < medium; i++) out.push(q(`m${i}`, "medium"))
  for (let i = 0; i < hard; i++) out.push(q(`h${i}`, "hard"))
  return out
}

// Small deterministic LCG rng for reproducible tests.
function lcg(seed: number): Rng {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

function hist(qs: QuestionDto[]) {
  return qs.reduce(
    (acc, x) => ((acc[x.difficulty] = (acc[x.difficulty] ?? 0) + 1), acc),
    {} as Record<Difficulty, number>,
  )
}

describe("pickSessionQuestions", () => {
  test("TC-U090 | rich pool: session is 4 easy / 4 medium / 2 hard for n=10", () => {
    const res = pickSessionQuestions(pool(20, 20, 20), 10, lcg(1))
    expect(res).toHaveLength(10)
    expect(hist(res)).toEqual({ easy: 4, medium: 4, hard: 2 })
  })

  test("TC-U091 | pool smaller than n: returns the whole pool", () => {
    const p = pool(1, 1, 1)
    const res = pickSessionQuestions(p, 10, lcg(2))
    expect(res).toHaveLength(3)
    expect(new Set(res.map((x) => x.id))).toEqual(new Set(p.map((x) => x.id)))
  })

  test("TC-U092 | all-hard pool: session is all hard, length min(n, pool)", () => {
    const res = pickSessionQuestions(pool(0, 0, 15), 10, lcg(3))
    expect(res).toHaveLength(10)
    expect(res.every((x) => x.difficulty === "hard")).toBe(true)
  })

  test("TC-U093 | short easy bucket is topped up from other difficulties", () => {
    // only 1 easy, plenty medium/hard -> still 10 total, no dupes
    const res = pickSessionQuestions(pool(1, 20, 20), 10, lcg(4))
    expect(res).toHaveLength(10)
    expect(new Set(res.map((x) => x.id)).size).toBe(10)
  })

  test("TC-U094 | empty pool -> []", () => {
    expect(pickSessionQuestions([], 10, lcg(5))).toEqual([])
  })

  test("TC-U095 | n <= 0 -> []", () => {
    expect(pickSessionQuestions(pool(5, 5, 5), 0, lcg(6))).toEqual([])
    expect(pickSessionQuestions(pool(5, 5, 5), -3, lcg(6))).toEqual([])
  })

  test("TC-U096 | deterministic for a fixed seed", () => {
    const p = pool(20, 20, 20)
    const a = pickSessionQuestions(p, 10, lcg(42))
    const b = pickSessionQuestions(p, 10, lcg(42))
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id))
  })

  test("TC-U097 | 3-question pool (Grade 1 Vietnamese) -> those 3", () => {
    const p = pool(0, 3, 0)
    const res = pickSessionQuestions(p, 10, lcg(7))
    expect(res.map((x) => x.id).sort()).toEqual(["m0", "m1", "m2"])
  })
})

describe("shuffle", () => {
  test("TC-U098 | preserves multiset, changes nothing else", () => {
    const arr = [1, 2, 3, 4, 5]
    const out = shuffle(arr, lcg(9))
    expect(out).not.toBe(arr)
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
  })
})
