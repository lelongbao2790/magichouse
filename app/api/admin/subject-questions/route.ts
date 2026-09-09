import { z } from 'zod'
import { apiSuccess, apiError } from '@/lib/api-response'
import { requireAdmin, isResponse } from '@/lib/admin-guard'
import {
  SubjectQuestionCreateSchema,
  SubjectQuestionUpdateSchema,
} from '@/lib/validation/api'
import { validateModeCoverage, ModeCoverageError } from '@/lib/subject-content/resolve'
import {
  getSubjectByKey,
  getSubjectById,
  getQuestionById,
  maxSortOrder,
  listAllQuestionsForSubject,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '@/lib/services/subject-content'

// A Postgres error from the mode-check trigger / CHECK constraints -> a 400.
function pgToApiError(err: unknown) {
  const message = err instanceof Error ? err.message : 'Invalid question'
  return apiError(message, 400)
}

export async function GET(request: Request) {
  try {
    const ctx = await requireAdmin(request)
    if (isResponse(ctx)) return ctx

    const subjectKey = new URL(request.url).searchParams.get('subjectKey')
    if (!subjectKey) return apiError('subjectKey query param is required', 400)

    const subject = await getSubjectByKey(ctx.admin, subjectKey)
    if (!subject) return apiError(`Unknown subject: ${subjectKey}`, 400)

    const rows = await listAllQuestionsForSubject(ctx.admin, subjectKey)
    return apiSuccess(rows)
  } catch (err) {
    console.error('[GET /api/admin/subject-questions]', err)
    return apiError('Internal server error', 500)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin(request)
    if (isResponse(ctx)) return ctx

    const parsed = SubjectQuestionCreateSchema.safeParse(await request.json())
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)
    const input = parsed.data

    const subject = await getSubjectByKey(ctx.admin, input.subjectKey)
    if (!subject) return apiError(`Unknown subject: ${input.subjectKey}`, 400)

    try {
      validateModeCoverage(
        {
          prompt_vi: input.promptVi ?? null,
          prompt_en: input.promptEn ?? null,
          options_vi: input.optionsVi ?? null,
          options_en: input.optionsEn ?? null,
        },
        subject,
      )
    } catch (e) {
      if (e instanceof ModeCoverageError) return apiError(e.message, 400)
      throw e
    }

    const sortOrder = input.sortOrder ?? (await maxSortOrder(ctx.admin, subject.id)) + 1

    try {
      const row = await createQuestion(ctx.admin, {
        subjectId: subject.id,
        sourceKey: null,
        promptVi: input.promptVi ?? null,
        promptEn: input.promptEn ?? null,
        optionsVi: input.optionsVi ?? null,
        optionsEn: input.optionsEn ?? null,
        correctIndex: input.correctIndex,
        difficulty: input.difficulty,
        isActive: input.isActive,
        sortOrder,
      })
      console.log(`[admin] POST subject_questions ${row.id} by ${ctx.user.email}`)
      return apiSuccess(row)
    } catch (err) {
      return pgToApiError(err)
    }
  } catch (err) {
    console.error('[POST /api/admin/subject-questions]', err)
    return apiError('Internal server error', 500)
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdmin(request)
    if (isResponse(ctx)) return ctx

    const parsed = SubjectQuestionUpdateSchema.safeParse(await request.json())
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)
    const { id, ...patch } = parsed.data

    const current = await getQuestionById(ctx.admin, id)
    if (!current) return apiError('Question not found', 404)

    const touchesText =
      patch.promptVi !== undefined ||
      patch.promptEn !== undefined ||
      patch.optionsVi !== undefined ||
      patch.optionsEn !== undefined

    if (touchesText) {
      const subject = await getSubjectById(ctx.admin, current.subject_id)
      if (!subject) return apiError('Parent subject not found', 400)
      try {
        validateModeCoverage(
          {
            prompt_vi: patch.promptVi !== undefined ? patch.promptVi : current.prompt_vi,
            prompt_en: patch.promptEn !== undefined ? patch.promptEn : current.prompt_en,
            options_vi: patch.optionsVi !== undefined ? patch.optionsVi : current.options_vi,
            options_en: patch.optionsEn !== undefined ? patch.optionsEn : current.options_en,
          },
          subject,
        )
      } catch (e) {
        if (e instanceof ModeCoverageError) return apiError(e.message, 400)
        throw e
      }
    }

    try {
      const row = await updateQuestion(ctx.admin, id, {
        promptVi: patch.promptVi,
        promptEn: patch.promptEn,
        optionsVi: patch.optionsVi,
        optionsEn: patch.optionsEn,
        correctIndex: patch.correctIndex,
        difficulty: patch.difficulty,
        isActive: patch.isActive,
        sortOrder: patch.sortOrder,
      })
      console.log(`[admin] PATCH subject_questions ${id} by ${ctx.user.email}`)
      return apiSuccess(row)
    } catch (err) {
      return pgToApiError(err)
    }
  } catch (err) {
    console.error('[PATCH /api/admin/subject-questions]', err)
    return apiError('Internal server error', 500)
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireAdmin(request)
    if (isResponse(ctx)) return ctx

    const id = new URL(request.url).searchParams.get('id')
    if (!id || !z.string().uuid().safeParse(id).success) {
      return apiError('id query param must be a UUID', 400)
    }

    await deleteQuestion(ctx.admin, id)
    console.log(`[admin] DELETE subject_questions ${id} by ${ctx.user.email}`)
    return apiSuccess(null)
  } catch (err) {
    console.error('[DELETE /api/admin/subject-questions]', err)
    return apiError('Internal server error', 500)
  }
}
