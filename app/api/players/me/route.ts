import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getPlayer } from '@/lib/services/player'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const player = await getPlayer(supabase, user.id)
    return apiSuccess(player)
  } catch (err) {
    if (err instanceof Error && err.message === 'Player not found') {
      return apiError('Player not found', 404)
    }
    console.error('[/api/players/me]', err)
    return apiError('Internal server error', 500)
  }
}
