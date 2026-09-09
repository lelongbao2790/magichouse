import { describe, test, expect } from "vitest"
import type { SubjectRow, SubjectQuestionRow } from "@/lib/database.types"
import {
  resolveQuestion,
  resolveTitle,
  effectiveLocale,
  rowToDto,
  dtoToWritePayload,
  IncompleteQuestionError,
} from "@/lib/subject-content/resolve"

// Example-based tests for the language-resolution logic (PBT-10 companion to
// subject-content.pbt.test.ts).

function subject(over: Partial<SubjectRow> = {}): SubjectRow {
  return {
    id: "s1",
    key: "grade2Vietnamese",
    title_vi: "Quiz Tiếng Việt Lớp 2",
    title_en: "Grade 2 Vietnamese Quiz",
    grade: "grade2",
    target_language: "vi",
    content_mode: "fixed",
    questions_per_session: 10,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...over,
  }
}

function row(over: Partial<SubjectQuestionRow> = {}): SubjectQuestionRow {
  return {
    id: "q1",
    subject_id: "s1",
    source_key: "grade2Vietnamese-001",
    prompt_vi: "Từ nào là từ chỉ màu sắc?",
    prompt_en: null,
    options_vi: ["Chạy", "Đỏ", "Bàn"],
    options_en: null,
    correct_index: 1,
    difficulty: "medium",
    is_active: true,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...over,
  }
}

describe("resolveQuestion — fixed subject (the language bug fix)", () => {
  test("TC-U069 | fixed vi subject: question stays Vietnamese when UI locale is 'en'", () => {
    const dto = resolveQuestion(row(), subject(), "en")
    expect(dto.question).toBe("Từ nào là từ chỉ màu sắc?")
    expect(dto.options).toEqual(["Chạy", "Đỏ", "Bàn"])
  })

  test("TC-U070 | fixed vi subject: identical output for locale 'vi' and 'en'", () => {
    expect(resolveQuestion(row(), subject(), "vi")).toEqual(
      resolveQuestion(row(), subject(), "en"),
    )
  })

  test("TC-U071 | fixed en subject: question stays English when UI locale is 'vi'", () => {
    const s = subject({ key: "grade2English", target_language: "en" })
    const r = row({
      prompt_vi: null,
      options_vi: null,
      prompt_en: "What is the opposite of 'hot'?",
      options_en: ["Warm", "Cold", "Wet"],
      correct_index: 1,
    })
    const dto = resolveQuestion(r, s, "vi")
    expect(dto.question).toBe("What is the opposite of 'hot'?")
    expect(dto.options).toEqual(["Warm", "Cold", "Wet"])
  })

  test("TC-U072 | effectiveLocale ignores uiLocale for fixed subjects", () => {
    expect(effectiveLocale(subject(), "en")).toBe("vi")
    expect(effectiveLocale(subject({ target_language: "en" }), "vi")).toBe("en")
  })
})

describe("resolveQuestion — localized subject (preschool, follows UI)", () => {
  const s = subject({
    key: "shapes",
    grade: "preschool",
    content_mode: "localized",
    target_language: "vi",
  })
  const r = row({
    source_key: "shapes-001",
    prompt_vi: "Đây là hình gì?",
    prompt_en: "What shape is this?",
    options_vi: ["Hình tròn", "Hình vuông", "Hình tam giác"],
    options_en: ["Circle", "Square", "Triangle"],
    correct_index: 1,
  })

  test("TC-U073 | localized subject: Vietnamese for 'vi'", () => {
    expect(resolveQuestion(r, s, "vi").question).toBe("Đây là hình gì?")
  })

  test("TC-U074 | localized subject: English for 'en'", () => {
    expect(resolveQuestion(r, s, "en").question).toBe("What shape is this?")
  })

  test("TC-U075 | localized subject: correctIndex + difficulty unchanged across locales", () => {
    const vi = resolveQuestion(r, s, "vi")
    const en = resolveQuestion(r, s, "en")
    expect(vi.correctIndex).toBe(en.correctIndex)
    expect(vi.difficulty).toBe(en.difficulty)
  })
})

describe("resolveQuestion — incomplete rows", () => {
  test("TC-U076 | throws IncompleteQuestionError when required prompt is null", () => {
    expect(() => resolveQuestion(row({ prompt_vi: null }), subject(), "vi")).toThrow(
      IncompleteQuestionError,
    )
  })

  test("TC-U077 | throws when options array is the wrong length", () => {
    expect(() =>
      resolveQuestion(row({ options_vi: ["only", "two"] as string[] }), subject(), "vi"),
    ).toThrow(IncompleteQuestionError)
  })
})

describe("resolveTitle", () => {
  test("TC-U078 | title follows the UI locale even for a fixed subject", () => {
    expect(resolveTitle(subject(), "en")).toBe("Grade 2 Vietnamese Quiz")
    expect(resolveTitle(subject(), "vi")).toBe("Quiz Tiếng Việt Lớp 2")
  })
})

describe("rowToDto / dtoToWritePayload round-trip", () => {
  test("TC-U079 | round-trip preserves target-locale prompt, options, index, difficulty", () => {
    const dto = rowToDto(row(), subject(), "vi")
    const payload = dtoToWritePayload(dto, subject())
    expect(payload.prompt_vi).toBe(row().prompt_vi)
    expect(payload.options_vi).toEqual(row().options_vi)
    expect(payload.correct_index).toBe(row().correct_index)
    expect(payload.difficulty).toBe(row().difficulty)
  })
})
