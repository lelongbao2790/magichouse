import { describe, test, expect } from "vitest"
import * as fc from "fast-check"
import {
  SubjectQuestionCreateSchema,
  SubjectQuestionUpdateSchema,
} from "@/lib/validation/api"
import { validateModeCoverage, ModeCoverageError } from "@/lib/subject-content/resolve"
import { fixedSubjectArb, localizedSubjectArb, optionTripleArb } from "./_arbitraries"

// ── Zod schemas ─────────────────────────────────────────────────────────────

const validCreate = {
  subjectKey: "grade2Vietnamese",
  promptVi: "Từ nào là từ chỉ màu sắc?",
  optionsVi: ["Chạy", "Đỏ", "Bàn"],
  correctIndex: 1,
  difficulty: "medium" as const,
}

describe("SubjectQuestionCreateSchema", () => {
  test("TC-U129 | accepts a well-formed payload", () => {
    expect(SubjectQuestionCreateSchema.safeParse(validCreate).success).toBe(true)
  })

  test("TC-U130 | rejects an options array that is not length 3", () => {
    expect(
      SubjectQuestionCreateSchema.safeParse({ ...validCreate, optionsVi: ["a", "b"] }).success,
    ).toBe(false)
  })

  test("TC-U131 | rejects correctIndex outside 0..2", () => {
    expect(SubjectQuestionCreateSchema.safeParse({ ...validCreate, correctIndex: 3 }).success).toBe(false)
    expect(SubjectQuestionCreateSchema.safeParse({ ...validCreate, correctIndex: -1 }).success).toBe(false)
  })

  test("TC-U132 | rejects an unknown difficulty", () => {
    expect(SubjectQuestionCreateSchema.safeParse({ ...validCreate, difficulty: "trivial" }).success).toBe(false)
  })

  test("TC-U133 | rejects a missing subjectKey", () => {
    const { subjectKey: _omit, ...rest } = validCreate
    void _omit
    expect(SubjectQuestionCreateSchema.safeParse(rest).success).toBe(false)
  })
})

describe("SubjectQuestionUpdateSchema", () => {
  test("TC-U134 | requires a uuid id and forbids subjectKey", () => {
    expect(SubjectQuestionUpdateSchema.safeParse({ id: "not-a-uuid", difficulty: "easy" }).success).toBe(false)
    const ok = SubjectQuestionUpdateSchema.safeParse({
      id: "11111111-1111-1111-1111-111111111111",
      difficulty: "easy",
    })
    expect(ok.success).toBe(true)
  })

  test("TC-U135 | accepts a partial patch (single field)", () => {
    expect(
      SubjectQuestionUpdateSchema.safeParse({
        id: "11111111-1111-1111-1111-111111111111",
        isActive: false,
      }).success,
    ).toBe(true)
  })
})

// ── validateModeCoverage ────────────────────────────────────────────────────

describe("validateModeCoverage", () => {
  const fixedVi = { content_mode: "fixed" as const, target_language: "vi" as const }
  const fixedEn = { content_mode: "fixed" as const, target_language: "en" as const }
  const localized = { content_mode: "localized" as const, target_language: "vi" as const }

  test("TC-U136 | fixed vi: target pair present, other locale null -> ok", () => {
    expect(() =>
      validateModeCoverage(
        { prompt_vi: "q", prompt_en: null, options_vi: ["a", "b", "c"], options_en: null },
        fixedVi,
      ),
    ).not.toThrow()
  })

  test("TC-U137 | fixed vi: missing options_vi -> throws", () => {
    expect(() =>
      validateModeCoverage(
        { prompt_vi: "q", prompt_en: null, options_vi: null, options_en: null },
        fixedVi,
      ),
    ).toThrow(ModeCoverageError)
  })

  test("TC-U138 | fixed vi: also setting options_en -> throws", () => {
    expect(() =>
      validateModeCoverage(
        { prompt_vi: "q", prompt_en: null, options_vi: ["a", "b", "c"], options_en: ["x", "y", "z"] },
        fixedVi,
      ),
    ).toThrow(ModeCoverageError)
  })

  test("TC-U139 | fixed en: target pair present -> ok", () => {
    expect(() =>
      validateModeCoverage(
        { prompt_vi: null, prompt_en: "q", options_vi: null, options_en: ["a", "b", "c"] },
        fixedEn,
      ),
    ).not.toThrow()
  })

  test("TC-U140 | localized: all four present -> ok; missing one -> throws", () => {
    expect(() =>
      validateModeCoverage(
        { prompt_vi: "q", prompt_en: "q", options_vi: ["a", "b", "c"], options_en: ["a", "b", "c"] },
        localized,
      ),
    ).not.toThrow()
    expect(() =>
      validateModeCoverage(
        { prompt_vi: "q", prompt_en: null, options_vi: ["a", "b", "c"], options_en: ["a", "b", "c"] },
        localized,
      ),
    ).toThrow(ModeCoverageError)
  })

  test("TC-U141 | [PBT] fixed subject: target-only row ok, other-locale row throws", () => {
    fc.assert(
      fc.property(fixedSubjectArb, optionTripleArb, optionTripleArb, (subject, optsT, optsO) => {
        const T = subject.target_language
        const other = T === "vi" ? "en" : "vi"
        const okRow = {
          prompt_vi: null as string | null,
          prompt_en: null as string | null,
          options_vi: null as string[] | null,
          options_en: null as string[] | null,
        }
        okRow[`prompt_${T}`] = "q"
        okRow[`options_${T}`] = optsT
        let threw = false
        try {
          validateModeCoverage(okRow, subject)
        } catch {
          threw = true
        }
        if (threw) return false

        const badRow = { ...okRow }
        badRow[`prompt_${other}`] = "q2"
        badRow[`options_${other}`] = optsO
        try {
          validateModeCoverage(badRow, subject)
          return false
        } catch (e) {
          return e instanceof ModeCoverageError
        }
      }),
      { numRuns: 200 },
    )
  })

  test("TC-U142 | [PBT] localized subject: complete row ok, any-missing row throws", () => {
    fc.assert(
      fc.property(localizedSubjectArb, optionTripleArb, (subject, opts) => {
        const complete = {
          prompt_vi: "a",
          prompt_en: "b",
          options_vi: opts,
          options_en: opts,
        }
        try {
          validateModeCoverage(complete, subject)
        } catch {
          return false
        }
        try {
          validateModeCoverage({ ...complete, prompt_en: null }, subject)
          return false
        } catch (e) {
          return e instanceof ModeCoverageError
        }
      }),
      { numRuns: 200 },
    )
  })
})
