import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Service-role client — server-only, never imported from browser code.
// Used exclusively for Admin API calls (e.g. pre-checking email existence on login).
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
