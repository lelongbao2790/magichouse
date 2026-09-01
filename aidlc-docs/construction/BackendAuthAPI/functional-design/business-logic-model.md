# Business Logic Model — Unit 2: BackendAuthAPI

## Route: POST /api/auth/signup

```
Input: { email, password, name }

1. Parse + validate body with SignupSchema (Zod)
   → If invalid: apiError(validationMessage, 400)

2. supabase.auth.signUp({ email, password })
   → If error.message contains "already registered": apiError("An account with this email already exists", 409)
   → If other error: apiError(error.message, 400)

3. upsertPlayer(supabase, user.id, name.trim())
   → Creates players row: { id: user.id, name, coins: 0 }
   → If DB error: apiError("Failed to create player profile", 500)

4. getPlayer(supabase, user.id) → Player
   → apiSuccess(player)   // session cookie already set by Supabase SSR
```

---

## Route: POST /api/auth/login

```
Input: { email, password }

1. Parse + validate body with LoginSchema (Zod)
   → If invalid: apiError(validationMessage, 400)

2. supabase.auth.signInWithPassword({ email, password })
   → If error.message contains "Invalid login credentials":
       Attempt to distinguish cause:
       - Check if user exists: supabase.auth.admin is not available on client
       - Use error code from Supabase: "invalid_credentials" → "Wrong password"
         or check if signup lookup fails → "Email not registered"
       - Pragmatic approach: if error.code === "invalid_credentials" → "Wrong password"
         (Supabase returns this for both; map to "Wrong password" as approximation)
         Note: true "email not found" distinction requires service role lookup — deferred to NFR stage
   → If other error: apiError(error.message, 400)

3. getPlayer(supabase, user.id) → Player
   → apiSuccess(player)   // session cookie set by Supabase SSR
```

> **Implementation note on Q1=B**: Supabase's `signInWithPassword` returns
> `"Invalid login credentials"` for both wrong password and unknown email. Distinguishing
> them requires a service-role lookup (check if user exists by email). This will be
> designed precisely in NFR Design. The business intent is:
> - Unknown email → `"Email not registered"`
> - Known email + wrong password → `"Wrong password"`

---

## Route: POST /api/auth/logout

```
Input: (session cookie only)

1. supabase.auth.signOut()
   → Always succeeds (even if no session)

2. apiSuccess(null)   // cookie cleared by Supabase SSR
```

---

## Route: GET /api/auth/session

```
Input: (session cookie only)

1. const { data: { user }, error } = await supabase.auth.getUser()
   → If error or user is null: apiSuccess(null)   // not authenticated — not an error

2. getPlayer(supabase, user.id) → Player
   → If player not found: apiSuccess(null)
   → apiSuccess(player)
```

---

## Service: lib/services/player.ts (Unit 2 subset)

### getPlayer(supabase, userId): Promise<Player>
```
SELECT id, name, coins, created_at FROM players WHERE id = userId
→ If not found: throw new Error("Player not found")
→ Map row → Player object
```

### upsertPlayer(supabase, userId, name): Promise<Player>
```
INSERT INTO players (id, name, coins)
VALUES (userId, name, 0)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
RETURNING id, name, coins, created_at
→ Map row → Player object
```

---

## AuthContext State Machine

```
INITIAL STATE
  session: null
  player: null
  isLoading: false
  isAuthenticated: false
       |
       | mount → useEffect fires GET /api/auth/session
       |
       +--[session found]──────────────────────────────→ AUTHENTICATED
       |                                                  session: Session
       |                                                  player: Player
       |                                                  isLoading: false
       |                                                  isAuthenticated: true
       |
       +--[no session / null]──────────────────────────→ UNAUTHENTICATED (stays initial state)

UNAUTHENTICATED
       |
       | signIn(email, password)
       | isLoading = true → POST /api/auth/login
       +--[success]────────────────────────────────────→ AUTHENTICATED
       +--[error]──────────────────────────────────────→ UNAUTHENTICATED (error returned to caller)
       |
       | signUp(email, password, name)
       | isLoading = true → POST /api/auth/signup
       +--[success]────────────────────────────────────→ AUTHENTICATED
       +--[error]──────────────────────────────────────→ UNAUTHENTICATED (error returned to caller)

AUTHENTICATED
       |
       | signOut()
       | isLoading = true → POST /api/auth/logout
       +──────────────────────────────────────────────→ UNAUTHENTICATED (session/player cleared)
```

**Q2=B**: `isLoading` starts `false`. WelcomeScreen renders immediately. The background
`useEffect` session check does not flip `isLoading` — it silently updates state on success.
Only explicit user actions (`signIn`, `signUp`, `signOut`) set `isLoading = true`.

---

## Supabase Client Strategy

### lib/supabase/server.ts
- Uses `@supabase/ssr` `createServerClient`
- Reads/writes cookies via Next.js `cookies()` from `next/headers`
- Called inside every API route handler (new instance per request)
- Uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### lib/supabase/client.ts
- Uses `@supabase/ssr` `createBrowserClient`
- Singleton pattern — one instance per browser session
- Used by AuthContext in the browser for session restoration
- Uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
