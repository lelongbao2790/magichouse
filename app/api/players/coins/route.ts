import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { AddCoinsSchema } from '@/lib/validation/api'
import { addCoins } from '@/lib/services/player'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const body = await request.json()
    const parsed = AddCoinsSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    const updatedPlayer = await addCoins(supabase, user.id, parsed.data.amount)
    return apiSuccess(updatedPlayer)
  } catch (err) {
    console.error('[/api/players/coins]', err)
    return apiError('Internal server error', 500)
  }
}
