# NFR Design Patterns — Unit 2: BackendAuthAPI

## Security Pattern: Login Error Distinction via Admin Pre-Check (Q1=A)

The login route uses a two-step pattern to return specific error messages:

```
Step 1 — Pre-check (Admin API, service role key):
  adminClient.auth.admin.getUserByEmail(email)
  → If user not found: return apiError("Email not registered", 401)
  → If user found: proceed to Step 2

Step 2 — Login attempt (SSR client, anon key):
  supabase.auth.signInWithPassword({ email, password })
  → If error: return apiError("Wrong password", 401)
  → If success: load player, return apiSuccess(player)
```

**Admin client** (`lib/supabase/admin.ts`) — separate from the SSR server client:
```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

- Uses `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to browser)
- `autoRefreshToken: false` and `persistSession: false` — stateless, per-request
- Used **only** in the login route for the pre-check; not a general-purpose client

**Timing note**: The two-call pattern adds ~50–150 ms to failed login responses. This
is acceptable for a children's app and is not a significant timing oracle risk at this scale.

---

## Security Pattern: Server-Side Session Validation (SECURITY-08)

Every route that requires authentication follows this pattern:

```typescript
// At the top of every authenticated route handler:
const supabase = createServerClient()
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  return apiError('Not authenticated', 401)
}
// Proceed with user.id
```

`getUser()` validates the JWT against Supabase's public key — no manual JWT parsing.
The session cookie is read automatically by `@supabase/ssr` via `next/headers`.

**Routes requiring this check**: All except `/api/auth/signup`, `/api/auth/login`,
and `/api/auth/session` (which handles its own null case).

---

## Resilience Pattern: Stale Cookie Clearing (Q2=A)

When `GET /api/auth/session` detects an invalid or expired cookie:

```typescript
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  // Actively clear stale cookie to prevent it accumulating
  await supabase.auth.signOut()
  return apiSuccess(null)
}
```

`supabase.auth.signOut()` writes a cookie-clearing response header.
The browser removes the stale `sb-<ref>-auth-token` cookie immediately.

---

## Resilience Pattern: Universal try/catch (SECURITY-15)

Every route handler is wrapped in a top-level try/catch:

```typescript
export async function POST(request: Request) {
  try {
    // ... route logic
  } catch (err) {
    console.error('[/api/auth/...] Unexpected error:', err)
    return apiError('Internal server error', 500)
  }
}
```

- `console.error` logs the full error server-side for debugging
- Client receives only the generic message — no stack traces, no internal details
- Covers unexpected Supabase SDK errors, network failures, and DB errors

---

## Security Pattern: Zod Parse-Before-Process (SECURITY-05)

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = SignupSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400)
    }
    const { email, password, name } = parsed.data
    // ... proceed with validated data only
  } catch { ... }
}
```

`request.json()` is inside try/catch — malformed JSON returns 500 (acceptable; client bug).
`safeParse` is used over `parse` to avoid thrown exceptions for validation failures.

---

## Cookie Security (Managed by @supabase/ssr — No Custom Config)

| Property | Value | How Set |
|---|---|---|
| HttpOnly | true | @supabase/ssr default |
| Secure | true (production) | @supabase/ssr default |
| SameSite | Lax | @supabase/ssr default |
| Token refresh | Automatic | @supabase/ssr middleware |

No custom cookie configuration required in route handlers.

---

## Security Compliance Summary

| Rule | Verdict | Pattern Applied |
|---|---|---|
| SECURITY-05 | Compliant | Zod parse-before-process on all inputs |
| SECURITY-08 | Compliant | `getUser()` server-side validation in every authenticated route |
| SECURITY-09 | Compliant | No credentials hardcoded; env vars used |
| SECURITY-12 | Compliant | Admin pre-check pattern for login distinction; Supabase handles bcrypt + rate limiting |
| SECURITY-15 | Compliant | Universal try/catch; no stack traces in responses |
| All others | N/A | Apply to DB layer (Unit 1) or data API (Unit 3) |
