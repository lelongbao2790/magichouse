import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { QuizHistorySchema } from '@/lib/validation/api'
import { recordHistory, getHistory } from '@/lib/services/quiz'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const rows = await getHistory(supabase, user.id)
    return apiSuccess(rows)
  } catch (err) {
    console.error('[GET /api/quiz/history]', err)
    return apiError('Internal server error', 500)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const body = await request.json()
    const parsed = QuizHistorySchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    const { category, score, totalQuestions, coinsEarned } = parsed.data
    await recordHistory(supabase, user.id, { category, score, totalQuestions, coinsEarned })
    return apiSuccess(null)
  } catch (err) {
    console.error('[POST /api/quiz/history]', err)
    return apiError('Internal server error', 500)
  }
}
