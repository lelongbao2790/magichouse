import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { RoomSchema, LocaleSchema } from '@/lib/validation/api'
import { getCatalog } from '@/lib/services/house-items'

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const searchParams = new URL(request.url).searchParams

    // room defaults to 'bedroom' if omitted; a present-but-invalid value is a 400 (BR-1).
    const roomParam = searchParams.get('room') ?? 'bedroom'
    const parsedRoom = RoomSchema.safeParse(roomParam)
    if (!parsedRoom.success) return apiError('Invalid room', 400)

    const localeParam = searchParams.get('locale') ?? 'vi'
    const parsedLocale = LocaleSchema.safeParse(localeParam)
    if (!parsedLocale.success) return apiError('Invalid locale', 400)

    const catalog = await getCatalog(supabase, parsedRoom.data, parsedLocale.data)
    return apiSuccess(catalog)
  } catch (err) {
    console.error('[GET /api/house-items]', err)
    return apiError('Internal server error', 500)
  }
}
