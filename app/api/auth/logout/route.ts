import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST() {
  try {
    const supabase = await createServerClient()
    await supabase.auth.signOut()
    return apiSuccess(null)
  } catch (err) {
    console.error('[/api/auth/logout]', err)
    return apiError('Internal server error', 500)
  }
}
