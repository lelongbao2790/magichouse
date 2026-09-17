import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getPlayer } from '@/lib/services/player'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return apiSuccess(null)
    }

    const player = await getPlayer(supabase, user.id)
    return apiSuccess(player)
  } catch {
    // Session errors are not fatal — return null (unauthenticated)
    return apiSuccess(null)
  }
}
