import { describe, test, expect } from "vitest"
import type { SubjectRow, SubjectQuestionRow } from "@/lib/database.types"
import { getSubjectContent } from "@/lib/services/subject-content"
import { IncompleteQuestionError } from "@/lib/subject-content/resolve"

// Minimal fake of the fragment of the Supabase query builder the service uses:
//   .from(table).select('*').eq(...).eq(...).order(...).order(...)   -> { data, error }
//   .from(table).select('*').eq(...).maybeSingle()                   -> { data, error }
function fakeSupabase(store: {
  subjects: SubjectRow[]
  subject_questions: SubjectQuestionRow[]
}) {
  return {
    from(table: "subjects" | "subject_questions") {
      const rows: unknown[] = [...store[table]]
      let filtered = rows as Array<Record<string, unknown>>
      const builder = {
        select() {
          return builder
        },
        eq(col: string, val: unknown) {
          filtered = filtered.filter((r) => r[col] === val)
          return builder
        },
        order() {
          return builder
        },
        async maybeSingle() {
          return { data: filtered[0] ?? null, error: null }
        },
        then(resolve: (v: { data: unknown; error: null }) => void) {
          resolve({ data: filtered, error: null })
        },
      }
      return builder
    },
  }
}

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

function question(id: string, over: Partial<SubjectQuestionRow> = {}): SubjectQuestionRow {
  return {
    id,
    subject_id: "s1",
    source_key: `grade2Vietnamese-${id}`,
    prompt_vi: `câu hỏi ${id}`,
    prompt_en: null,
    options_vi: ["a", "b", "c"],
    options_en: null,
    correct_index: 0,
    difficulty: "medium",
    is_active: true,
    sort_order: Number(id),
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...over,
  }
}

describe("getSubjectContent (TP-5)", () => {
  test("TC-U086 | unknown key returns null", async () => {
    const sb = fakeSupabase({ subjects: [subject()], subject_questions: [] })
    const result = await getSubjectContent(sb as any, "does-not-exist", "vi")
    expect(result).toBeNull()
  })

  test("TC-U087 | returns exactly the active questions, resolved, in order", async () => {
    const sb = fakeSupabase({
      subjects: [subject()],
      subject_questions: [
        question("1"),
        question("2", { is_active: false }),
        question("3"),
      ],
    })
    const result = await getSubjectContent(sb as any, "grade2Vietnamese", "en")
    expect(result?.questions.map((q) => q.id)).toEqual(["1", "3"])
    expect(result?.title).toBe("Grade 2 Vietnamese Quiz") // title follows UI locale
    expect(result?.questions[0].question).toBe("câu hỏi 1") // fixed -> Vietnamese despite 'en'
    expect(result?.questionsPerSession).toBe(10)
  })

  test("TC-U088 | one incomplete active row makes the whole call throw (no short list)", async () => {
    const sb = fakeSupabase({
      subjects: [subject()],
      subject_questions: [question("1"), question("2", { prompt_vi: null })],
    })
    await expect(
      getSubjectContent(sb as any, "grade2Vietnamese", "vi"),
    ).rejects.toBeInstanceOf(IncompleteQuestionError)
  })

  test("TC-U089 | subject with no active questions returns an empty list, not an error", async () => {
    const sb = fakeSupabase({
      subjects: [subject()],
      subject_questions: [question("1", { is_active: false })],
    })
    const result = await getSubjectContent(sb as any, "grade2Vietnamese", "vi")
    expect(result?.questions).toEqual([])
  })
})
