import { describe, test } from "vitest"
import * as fc from "fast-check"
import {
  resolveQuestion,
  rowToDto,
  dtoToWritePayload,
  IncompleteQuestionError,
} from "@/lib/subject-content/resolve"
import {
  fixedSubjectArb,
  localizedSubjectArb,
  subjectShapeArb,
  localeArb,
  questionRowArb,
  corruptedQuestionRowArb,
} from "./_arbitraries"

const PBT_OPTS = { verbose: true, numRuns: 200 } as const

// ── PBT-B: language resolution invariance (TP-1, TP-2, TP-4) ─────────────────

describe("resolveQuestion — PBT-B (language resolution)", () => {
  test("TC-U080 | [PBT] fixed subject: output text is independent of uiLocale (TP-1)", () => {
    fc.assert(
      fc.property(
        fixedSubjectArb.chain((s) => fc.tuple(fc.constant(s), questionRowArb(s))),
        ([subject, row]) => {
          const vi = resolveQuestion(row, subject, "vi")
          const en = resolveQuestion(row, subject, "en")
          const target = subject.target_language === "vi" ? row.prompt_vi : row.prompt_en
          return (
            vi.question === en.question &&
            vi.question === target &&
            JSON.stringify(vi.options) === JSON.stringify(en.options)
          )
        },
      ),
      PBT_OPTS,
    )
  })

  test("TC-U081 | [PBT] localized subject: output text matches the requested locale (TP-2)", () => {
    fc.assert(
      fc.property(
        localizedSubjectArb.chain((s) =>
          fc.tuple(fc.constant(s), questionRowArb(s), localeArb),
        ),
        ([subject, row, locale]) => {
          const dto = resolveQuestion(row, subject, locale)
          const expectedPrompt = locale === "vi" ? row.prompt_vi : row.prompt_en
          const expectedOptions = locale === "vi" ? row.options_vi : row.options_en
          return (
            dto.question === expectedPrompt &&
            JSON.stringify(dto.options) === JSON.stringify(expectedOptions)
          )
        },
      ),
      PBT_OPTS,
    )
  })

  test("TC-U082 | [PBT] correctIndex + difficulty are passed through unchanged (TP-2)", () => {
    fc.assert(
      fc.property(
        subjectShapeArb.chain((s) =>
          fc.tuple(fc.constant(s), questionRowArb(s), localeArb),
        ),
        ([subject, row, locale]) => {
          const dto = resolveQuestion(row, subject, locale)
          return dto.correctIndex === row.correct_index && dto.difficulty === row.difficulty
        },
      ),
      PBT_OPTS,
    )
  })

  test("TC-U083 | [PBT] valid row -> options.length === 3 and 0 <= correctIndex <= 2 (TP-4)", () => {
    fc.assert(
      fc.property(
        subjectShapeArb.chain((s) =>
          fc.tuple(fc.constant(s), questionRowArb(s), localeArb),
        ),
        ([subject, row, locale]) => {
          const dto = resolveQuestion(row, subject, locale)
          return dto.options.length === 3 && dto.correctIndex >= 0 && dto.correctIndex <= 2
        },
      ),
      PBT_OPTS,
    )
  })

  test("TC-U084 | [PBT] corrupted row always throws IncompleteQuestionError (TP-4)", () => {
    fc.assert(
      fc.property(
        subjectShapeArb.chain((s) =>
          fc.tuple(fc.constant(s), corruptedQuestionRowArb(s), localeArb),
        ),
        ([subject, row, locale]) => {
          try {
            resolveQuestion(row, subject, locale)
            return false
          } catch (e) {
            return e instanceof IncompleteQuestionError
          }
        },
      ),
      PBT_OPTS,
    )
  })
})

// ── PBT-C: row -> DTO -> write payload round-trip (TP-3) ─────────────────────

describe("rowToDto / dtoToWritePayload — PBT-C (round-trip)", () => {
  test("TC-U085 | [PBT] round-trip preserves the persisted content fields (TP-3)", () => {
    fc.assert(
      fc.property(
        subjectShapeArb.chain((s) => fc.tuple(fc.constant(s), questionRowArb(s))),
        ([subject, row]) => {
          const base = subject.content_mode === "fixed" ? subject.target_language : "vi"
          const dto = rowToDto(row, subject, base)
          const payload = dtoToWritePayload(dto, subject)
          const prompt = base === "vi" ? payload.prompt_vi : payload.prompt_en
          const options = base === "vi" ? payload.options_vi : payload.options_en
          const rowPrompt = base === "vi" ? row.prompt_vi : row.prompt_en
          const rowOptions = base === "vi" ? row.options_vi : row.options_en
          return (
            prompt === rowPrompt &&
            JSON.stringify(options) === JSON.stringify(rowOptions) &&
            payload.correct_index === row.correct_index &&
            payload.difficulty === row.difficulty
          )
        },
      ),
      PBT_OPTS,
    )
  })
})
