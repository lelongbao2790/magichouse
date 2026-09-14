import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { LocaleSchema } from '@/lib/validation/api'
import { getRooms } from '@/lib/services/house-items'

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const localeParam = new URL(request.url).searchParams.get('locale') ?? 'vi'
    const parsedLocale = LocaleSchema.safeParse(localeParam)
    if (!parsedLocale.success) return apiError('Invalid locale', 400)

    const rooms = await getRooms(supabase, parsedLocale.data)
    return apiSuccess(rooms)
  } catch (err) {
    console.error('[GET /api/rooms]', err)
    return apiError('Internal server error', 500)
  }
}
