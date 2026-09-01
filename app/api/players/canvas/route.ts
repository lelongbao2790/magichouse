import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { CanvasSchema } from '@/lib/validation/api'
import { getCanvas, saveCanvas } from '@/lib/services/canvas'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const canvasData = await getCanvas(supabase, user.id)
    return apiSuccess(canvasData)
  } catch (err) {
    console.error('[GET /api/players/canvas]', err)
    return apiError('Internal server error', 500)
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const body = await request.json()
    const parsed = CanvasSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    await saveCanvas(supabase, user.id, parsed.data.canvasData)
    return apiSuccess(null)
  } catch (err) {
    console.error('[PUT /api/players/canvas]', err)
    return apiError('Internal server error', 500)
  }
}
