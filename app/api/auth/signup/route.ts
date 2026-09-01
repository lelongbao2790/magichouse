import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, apiError } from '@/lib/api-response'
import { SignupSchema } from '@/lib/validation/api'
import { upsertPlayer, getPlayer } from '@/lib/services/player'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = SignupSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400)
    }

    const { email, password, name } = parsed.data
    const admin = createAdminClient()

    // Create user with email pre-confirmed — no verification email sent
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      if (createError.message.toLowerCase().includes('already registered') ||
          createError.message.toLowerCase().includes('already been registered')) {
        return apiError('An account with this email already exists', 409)
      }
      return apiError(createError.message, 400)
    }

    if (!created.user) {
      return apiError('Signup failed', 500)
    }

    // Create the player row via service role (players table has no RLS INSERT policy)
    await upsertPlayer(admin, created.user.id, name.trim())

    // Sign the new user in to establish the session cookie
    const supabase = await createServerClient()
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError || !session.user) {
      return apiError('Account created but sign-in failed. Please sign in manually.', 500)
    }

    const player = await getPlayer(admin, created.user.id)
    return apiSuccess(player)
  } catch (err) {
    console.error('[/api/auth/signup]', err)
    return apiError('Internal server error', 500)
  }
}
