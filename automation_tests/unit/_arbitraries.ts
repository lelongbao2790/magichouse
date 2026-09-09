import * as fc from "fast-check"
import type { SubjectRow, SubjectQuestionRow } from "@/lib/database.types"

// Reusable fast-check generators for subject-content property tests (PBT-07).

export const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter((s) => s.trim().length > 0)

export const optionTripleArb: fc.Arbitrary<string[]> = fc.tuple(
  nonEmptyStringArb,
  nonEmptyStringArb,
  nonEmptyStringArb,
)

export const difficultyArb = fc.constantFrom(
  "easy" as const,
  "medium" as const,
  "hard" as const,
)

export const localeArb = fc.constantFrom("vi" as const, "en" as const)

type SubjectShape = Pick<
  SubjectRow,
  "content_mode" | "target_language" | "title_vi" | "title_en"
>

export const fixedSubjectArb: fc.Arbitrary<SubjectShape> = fc.record({
  content_mode: fc.constant("fixed" as const),
  target_language: localeArb,
  title_vi: nonEmptyStringArb,
  title_en: nonEmptyStringArb,
})

export const localizedSubjectArb: fc.Arbitrary<SubjectShape> = fc.record({
  content_mode: fc.constant("localized" as const),
  target_language: fc.constant("vi" as const),
  title_vi: nonEmptyStringArb,
  title_en: nonEmptyStringArb,
})

export const subjectShapeArb = fc.oneof(fixedSubjectArb, localizedSubjectArb)

function baseRow(): Pick<
  SubjectQuestionRow,
  | "id"
  | "subject_id"
  | "source_key"
  | "correct_index"
  | "difficulty"
  | "is_active"
  | "sort_order"
  | "created_at"
  | "updated_at"
> {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    subject_id: "00000000-0000-0000-0000-0000000000aa",
    source_key: null,
    correct_index: 0,
    difficulty: "easy",
    is_active: true,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  }
}

/** A row that is VALID for the given subject's content_mode. */
export function questionRowArb(subject: SubjectShape): fc.Arbitrary<SubjectQuestionRow> {
  return fc
    .record({
      id: fc.uuid(),
      prompt: nonEmptyStringArb,
      options: optionTripleArb,
      correct_index: fc.integer({ min: 0, max: 2 }),
      difficulty: difficultyArb,
      sort_order: fc.integer({ min: 0, max: 100 }),
    })
    .map((r) => {
      const row: SubjectQuestionRow = {
        ...baseRow(),
        id: r.id,
        correct_index: r.correct_index,
        difficulty: r.difficulty,
        sort_order: r.sort_order,
        prompt_vi: null,
        prompt_en: null,
        options_vi: null,
        options_en: null,
      }
      if (subject.content_mode === "localized") {
        row.prompt_vi = r.prompt
        row.prompt_en = r.prompt + " (en)"
        row.options_vi = r.options
        row.options_en = r.options.map((o) => o + " (en)")
      } else if (subject.target_language === "vi") {
        row.prompt_vi = r.prompt
        row.options_vi = r.options
      } else {
        row.prompt_en = r.prompt
        row.options_en = r.options
      }
      return row
    })
}

/**
 * A row MISSING required prompt text for the throw-path property. Both prompts
 * are nulled so `resolveQuestion` throws regardless of the requested locale.
 */
export function corruptedQuestionRowArb(
  subject: SubjectShape,
): fc.Arbitrary<SubjectQuestionRow> {
  return questionRowArb(subject).map((row) => ({
    ...row,
    prompt_vi: null,
    prompt_en: null,
  }))
}
