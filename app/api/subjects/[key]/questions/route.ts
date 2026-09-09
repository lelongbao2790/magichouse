import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { LocaleSchema } from '@/lib/validation/api'
import { getSubjectContent } from '@/lib/services/subject-content'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const { key } = await params

    const localeParam = new URL(request.url).searchParams.get('locale') ?? 'vi'
    const parsedLocale = LocaleSchema.safeParse(localeParam)
    if (!parsedLocale.success) return apiError('Invalid locale', 400)

    const content = await getSubjectContent(supabase, key, parsedLocale.data)
    if (!content) return apiError('Subject not found', 404)

    return apiSuccess(content)
  } catch (err) {
    console.error('[GET /api/subjects/[key]/questions]', err)
    return apiError('Internal server error', 500)
  }
}
