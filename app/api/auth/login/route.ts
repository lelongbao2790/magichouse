import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, apiError } from '@/lib/api-response'
import { LoginSchema } from '@/lib/validation/api'
import { getPlayer } from '@/lib/services/player'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400)
    }

    const { email, password } = parsed.data

    // Admin pre-check: distinguish "email not registered" vs "wrong password".
    // listUsers fetches all users — acceptable for this app's scale.
    const adminClient = createAdminClient()
    const { data: usersData } = await adminClient.auth.admin.listUsers()
    const emailExists = usersData.users.some(u => u.email === email)
    if (!emailExists) {
      return apiError('Email not registered', 401)
    }

    const supabase = await createServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      return apiError('Wrong password', 401)
    }

    const player = await getPlayer(supabase, data.user.id)
    return apiSuccess(player)
  } catch (err) {
    console.error('[/api/auth/login]', err)
    return apiError('Internal server error', 500)
  }
}
