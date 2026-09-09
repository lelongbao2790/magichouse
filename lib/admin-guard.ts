import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api-response'
import { isAdminEmail, getAdminEmails } from '@/lib/admin-auth'

type AdminContext = { user: User; admin: SupabaseClient<Database> }

/**
 * Gate for the admin content API. Returns an `apiError` Response to return directly,
 * or an `{ user, admin }` context (admin = service-role client) when the caller is
 * an authenticated, allowlisted admin.
 */
export async function requireAdmin(
  request: Request,
): Promise<AdminContext | ReturnType<typeof apiError>> {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return apiError('Not authenticated', 401)

  if (!isAdminEmail(user.email, getAdminEmails())) {
    console.warn(`[admin] 403 ${user.email ?? 'unknown'} ${new URL(request.url).pathname}`)
    return apiError('Forbidden', 403)
  }

  return { user, admin: createAdminClient() }
}

export function isResponse(v: unknown): v is ReturnType<typeof apiError> {
  return v instanceof Response
}
