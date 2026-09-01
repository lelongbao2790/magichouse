import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCatalog } from '@/lib/services/stickers'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const stickers = await getCatalog(supabase)
    return apiSuccess(stickers)
  } catch (err) {
    console.error('[/api/stickers]', err)
    return apiError('Internal server error', 500)
  }
}
