import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { MigrateSchema } from '@/lib/validation/api'
import { migrateFromLocalStorage } from '@/lib/services/player'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const body = await request.json()
    const parsed = MigrateSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    await migrateFromLocalStorage(supabase, user.id, parsed.data.coins, parsed.data.ownedStickers)
    return apiSuccess({ migrated: true })
  } catch (err) {
    console.error('[/api/players/migrate]', err)
    return apiError('Internal server error', 500)
  }
}
