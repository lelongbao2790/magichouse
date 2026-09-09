import type { SubjectRow, SubjectQuestionRow } from '@/lib/database.types'
import type { Locale, QuestionDto } from './types'

/**
 * Thrown when an active question is missing the prompt/options text that its
 * subject's content_mode requires. The service turns this into an HTTP 500
 * rather than silently serving a shorter quiz (business-rules BR-3.1).
 */
export class IncompleteQuestionError extends Error {
  constructor(questionId: string) {
    super(`subject_questions row ${questionId} is missing required-locale text`)
    this.name = 'IncompleteQuestionError'
  }
}

type SubjectShape = Pick<SubjectRow, 'content_mode' | 'target_language'>

/**
 * The language the question text must be shown in.
 *
 * - `fixed`      -> always the subject's target language, regardless of `uiLocale`.
 *                   THIS is the fix for "Vietnamese subject shows English when the
 *                   UI is English".
 * - `localized`  -> the requested UI locale.
 */
export function effectiveLocale(subject: SubjectShape, uiLocale: Locale): Locale {
  return subject.content_mode === 'fixed' ? subject.target_language : uiLocale
}

/** Resolve one row to a single-language DTO. Pure. */
export function resolveQuestion(
  row: SubjectQuestionRow,
  subject: SubjectShape,
  uiLocale: Locale,
): QuestionDto {
  const loc = effectiveLocale(subject, uiLocale)
  const prompt = loc === 'vi' ? row.prompt_vi : row.prompt_en
  const options = loc === 'vi' ? row.options_vi : row.options_en

  if (prompt == null || options == null || options.length !== 3) {
    throw new IncompleteQuestionError(row.id)
  }

  return {
    id: row.id,
    question: prompt,
    options,
    correctIndex: row.correct_index,
    difficulty: row.difficulty,
  }
}

/** Raised when an admin write's prompt/options don't match the subject's content_mode. */
export class ModeCoverageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ModeCoverageError'
  }
}

type CoverageRow = Pick<
  SubjectQuestionRow,
  'prompt_vi' | 'prompt_en' | 'options_vi' | 'options_en'
>
type CoverageSubject = Pick<SubjectRow, 'content_mode' | 'target_language'>

/**
 * Validate that a (final) `subject_questions` row satisfies its subject's content_mode
 * (business-rules BR-U3-3.2). Pure — throws `ModeCoverageError` on violation.
 *
 * - fixed(L)   -> prompt_L + options_L present ; the OTHER locale's prompt/options empty
 * - localized  -> all four present
 */
export function validateModeCoverage(row: CoverageRow, subject: CoverageSubject): void {
  if (subject.content_mode === 'fixed') {
    const L = subject.target_language
    const other: Locale = L === 'vi' ? 'en' : 'vi'
    const promptL = L === 'vi' ? row.prompt_vi : row.prompt_en
    const optionsL = L === 'vi' ? row.options_vi : row.options_en
    const promptOther = other === 'vi' ? row.prompt_vi : row.prompt_en
    const optionsOther = other === 'vi' ? row.options_vi : row.options_en

    if (promptL == null || optionsL == null) {
      throw new ModeCoverageError(
        `fixed '${L}' subject: prompt_${L} and options_${L} are required`,
      )
    }
    if (promptOther != null || optionsOther != null) {
      throw new ModeCoverageError(
        `fixed '${L}' subject: prompt_${other}/options_${other} must be empty`,
      )
    }
    return
  }

  // localized
  if (
    row.prompt_vi == null ||
    row.prompt_en == null ||
    row.options_vi == null ||
    row.options_en == null
  ) {
    throw new ModeCoverageError(
      'localized subject: vi and en prompt+options are all required',
    )
  }
}

/** Subject/quiz title always follows the UI locale — it is UI chrome, not lesson content. */
export function resolveTitle(
  subject: Pick<SubjectRow, 'title_vi' | 'title_en'>,
  uiLocale: Locale,
): string {
  return uiLocale === 'en' ? subject.title_en : subject.title_vi
}

/** Alias of resolveQuestion, named for the round-trip pair (rowToDto / dtoToWritePayload). */
export function rowToDto(
  row: SubjectQuestionRow,
  subject: SubjectShape,
  uiLocale: Locale,
): QuestionDto {
  return resolveQuestion(row, subject, uiLocale)
}

/**
 * Turn a resolved DTO back into the column values for the subject's stored language.
 * Round-trips the persisted content fields: for a `fixed` subject (or a `localized`
 * subject viewed at 'vi'), `dtoToWritePayload(rowToDto(row))` reproduces the row's
 * target-locale prompt/options, correct_index and difficulty.
 */
export function dtoToWritePayload(
  dto: QuestionDto,
  subject: SubjectShape,
): Partial<SubjectQuestionRow> {
  const loc: Locale = subject.content_mode === 'fixed' ? subject.target_language : 'vi'
  return loc === 'vi'
    ? {
        prompt_vi: dto.question,
        options_vi: dto.options,
        correct_index: dto.correctIndex,
        difficulty: dto.difficulty,
      }
    : {
        prompt_en: dto.question,
        options_en: dto.options,
        correct_index: dto.correctIndex,
        difficulty: dto.difficulty,
      }
}
