import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { RoomSchema, createHouseLayoutSchema } from '@/lib/validation/api'
import { getLayout, saveLayout, ItemNotOwnedError } from '@/lib/services/house-layout'
import { getCatalog } from '@/lib/services/house-items'

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    // room is required (no default) — invalid/missing value is a 400 (BR-1).
    const roomParam = new URL(request.url).searchParams.get('room')
    const parsedRoom = RoomSchema.safeParse(roomParam)
    if (!parsedRoom.success) return apiError('Invalid room', 400)

    const layout = await getLayout(supabase, user.id, parsedRoom.data)
    return apiSuccess(layout)
  } catch (err) {
    console.error('[GET /api/players/house-layout]', err)
    return apiError('Internal server error', 500)
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const body = await request.json()

    // Validate room first (BR-1) — needed before the count bound (BR-6) can be computed.
    const parsedRoom = RoomSchema.safeParse(body?.room)
    if (!parsedRoom.success) return apiError('Invalid room', 400)

    // BR-6: layoutData.length is capped at the room's active catalog item count,
    // read at validation time rather than hardcoded — locale is irrelevant to the count.
    const catalog = await getCatalog(supabase, parsedRoom.data, 'en')
    const parsed = createHouseLayoutSchema(catalog.length).safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    await saveLayout(supabase, user.id, parsed.data.room, parsed.data.layoutData)
    return apiSuccess(null)
  } catch (err) {
    if (err instanceof ItemNotOwnedError) {
      return apiError(err.message, 400)
    }
    console.error('[PUT /api/players/house-layout]', err)
    return apiError('Internal server error', 500)
  }
}
