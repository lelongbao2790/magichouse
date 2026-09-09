import { describe, test, expect } from "vitest"
import { readFileSync } from "node:fs"
import { resolve as resolvePath } from "node:path"
import type { SubjectRow, SubjectQuestionRow } from "@/lib/database.types"
import { resolveQuestion } from "@/lib/subject-content/resolve"

// ---------------------------------------------------------------------------
// Subject content — contract-level tests that don't need a live server.
// (Route-level TC-A025–027 for GET /api/subjects/[key]/questions are in U2.)
// ---------------------------------------------------------------------------

function subject(over: Partial<SubjectRow>): SubjectRow {
  return {
    id: "s1",
    key: "k",
    title_vi: "vi",
    title_en: "en",
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

function row(over: Partial<SubjectQuestionRow>): SubjectQuestionRow {
  return {
    id: "q1",
    subject_id: "s1",
    source_key: null,
    prompt_vi: null,
    prompt_en: null,
    options_vi: null,
    options_en: null,
    correct_index: 0,
    difficulty: "medium",
    is_active: true,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...over,
  }
}

describe("TC-A028 | fixed subject content is locale-independent", () => {
  test("grade2Vietnamese: ?locale=vi and ?locale=en resolve to identical question text", () => {
    const s = subject({ key: "grade2Vietnamese", content_mode: "fixed", target_language: "vi" })
    const r = row({
      prompt_vi: "Từ nào là từ chỉ màu sắc?",
      options_vi: ["Chạy", "Đỏ", "Bàn"],
      correct_index: 1,
    })
    const vi = resolveQuestion(r, s, "vi")
    const en = resolveQuestion(r, s, "en")
    expect(en).toEqual(vi)
    expect(en.question).toBe("Từ nào là từ chỉ màu sắc?")
  })
})

describe("TC-A029 | localized subject content follows the locale", () => {
  test("shapes: ?locale=vi returns Vietnamese, ?locale=en returns English", () => {
    const s = subject({ key: "shapes", grade: "preschool", content_mode: "localized", target_language: "vi" })
    const r = row({
      prompt_vi: "Đây là hình gì?",
      prompt_en: "What shape is this?",
      options_vi: ["Hình tròn", "Hình vuông", "Hình tam giác"],
      options_en: ["Circle", "Square", "Triangle"],
      correct_index: 1,
    })
    expect(resolveQuestion(r, s, "vi").question).toBe("Đây là hình gì?")
    expect(resolveQuestion(r, s, "en").question).toBe("What shape is this?")
    expect(resolveQuestion(r, s, "vi").correctIndex).toBe(resolveQuestion(r, s, "en").correctIndex)
  })
})

describe("TC-A030 | migration extends quiz_history.category CHECK", () => {
  test("0002 migration adds grade2Vietnamese and grade2English to the constraint", () => {
    const sql = readFileSync(
      resolvePath(process.cwd(), "supabase/migrations/0002_subject_content_schema.sql"),
      "utf8",
    )
    const checkClause = sql.slice(sql.indexOf("quiz_history_category_check CHECK"))
    expect(checkClause).toContain("'grade2Vietnamese'")
    expect(checkClause).toContain("'grade2English'")
    // and it must still allow the originals
    expect(checkClause).toContain("'shapes'")
    expect(checkClause).toContain("'timesTable'")
  })
})
