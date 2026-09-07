# Code Generation Plan — Unit 2: BackendAuthAPI

## Unit Context
- **Unit**: BackendAuthAPI
- **Depends on**: Unit 1 (players table, lib/database.types.ts)
- **Key patterns**: Admin API pre-check for login distinction; stale cookie clearing; try/catch on all routes
- **Zod**: already installed (^3.24.1) — no install needed
- **New packages**: @supabase/supabase-js, @supabase/ssr — must be added to package.json

## Stories Implemented
- FR-01: Email/password auth (signup, login, logout, session)
- FR-02 partial: Player row created on signup (upsertPlayer)
- FR-11: Auth-gated access (AuthContext gates Dashboard rendering)
- SECURITY-05: Zod validation on all auth routes
- SECURITY-08: getUser() session validation in every authenticated route
- SECURITY-12: Password min 8, Admin pre-check login distinction, Supabase rate limiting
- SECURITY-15: try/catch on all routes, no stack traces in responses

## Files to Generate

| Step | File | Action |
|---|---|---|
| 1 | `lib/supabase/server.ts` | CREATE |
| 2 | `lib/supabase/admin.ts` | CREATE |
| 3 | `lib/supabase/client.ts` | CREATE |
| 4 | `lib/api-response.ts` | CREATE |
| 5 | `lib/validation/api.ts` | CREATE (auth schemas only) |
| 6 | `lib/services/player.ts` | CREATE (getPlayer + upsertPlayer only) |
| 7 | `app/api/auth/signup/route.ts` | CREATE |
| 8 | `app/api/auth/login/route.ts` | CREATE |
| 9 | `app/api/auth/logout/route.ts` | CREATE |
| 10 | `app/api/auth/session/route.ts` | CREATE |
| 11 | `contexts/auth-context.tsx` | CREATE |
| 12 | `components/login-view.tsx` | CREATE |
| 13 | `components/register-view.tsx` | CREATE |
| 14 | `components/welcome-screen.tsx` | MODIFY (refactor to login/register switcher) |
| 15 | `package.json` | MODIFY (add @supabase/supabase-js + @supabase/ssr) |
| 16 | `aidlc-docs/construction/BackendAuthAPI/code/code-summary.md` | CREATE |

---

## Steps

### Step 1 — `lib/supabase/server.ts`
- [x] `createServerClient()` using `@supabase/ssr`, reads/writes cookies via `next/headers`
- [x] Uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2 — `lib/supabase/admin.ts`
- [x] `createAdminClient()` using `createClient` from `@supabase/supabase-js`
- [x] Uses `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- [x] `autoRefreshToken: false`, `persistSession: false` — stateless per-request

### Step 3 — `lib/supabase/client.ts`
- [x] `createBrowserClient()` using `@supabase/ssr`, singleton pattern
- [x] Uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 4 — `lib/api-response.ts`
- [x] `apiSuccess<T>(data: T)` → `NextResponse<{ data: T; error: null }>`
- [x] `apiError(message: string, status?: number)` → `NextResponse<{ data: null; error: string }>`

### Step 5 — `lib/validation/api.ts`
- [x] `SignupSchema`: email (z.string().email()), password (min 8), name (min 1, max 50)
- [x] `LoginSchema`: email (z.string().email()), password (non-empty)
- [x] Export inferred types: `SignupInput`, `LoginInput`

### Step 6 — `lib/services/player.ts`
- [x] `getPlayer(supabase, userId)`: SELECT from players WHERE id = userId → Player; throws if not found
- [x] `upsertPlayer(supabase, userId, name)`: INSERT ... ON CONFLICT DO UPDATE → Player

### Step 7 — `app/api/auth/signup/route.ts`
- [x] Parse + validate with SignupSchema; reject 400 on failure
- [x] `supabase.auth.signUp({ email, password })`; reject 409 if already registered
- [x] `upsertPlayer(supabase, user.id, name.trim())`
- [x] `getPlayer(supabase, user.id)` → `apiSuccess(player)`
- [x] Wrap in try/catch → `apiError('Internal server error', 500)`

### Step 8 — `app/api/auth/login/route.ts`
- [x] Parse + validate with LoginSchema; reject 400 on failure
- [x] Admin pre-check: `createAdminClient().auth.admin.getUserByEmail(email)`
  - Not found → `apiError('Email not registered', 401)`
- [x] `supabase.auth.signInWithPassword({ email, password })`
  - Error → `apiError('Wrong password', 401)`
- [x] `getPlayer(supabase, user.id)` → `apiSuccess(player)`
- [x] Wrap in try/catch → `apiError('Internal server error', 500)`

### Step 9 — `app/api/auth/logout/route.ts`
- [x] `supabase.auth.signOut()`
- [x] `apiSuccess(null)` — always 200 (idempotent)
- [x] Wrap in try/catch → `apiError('Internal server error', 500)`

### Step 10 — `app/api/auth/session/route.ts`
- [x] `supabase.auth.getUser()`
  - Error or null user → `signOut()` (clear stale cookie) → `apiSuccess(null)`
- [x] `getPlayer(supabase, user.id)` → `apiSuccess(player)`
- [x] Wrap in try/catch → `apiSuccess(null)` (session errors are not fatal)

### Step 11 — `contexts/auth-context.tsx`
- [x] `AuthContext` with `AuthContextType` interface
- [x] `AuthProvider` component: initial state `{ session: null, player: null, isLoading: false }`
- [x] `useEffect` on mount: fetch `GET /api/auth/session`; update state on success
- [x] `signIn(email, password)`: `isLoading=true` → POST `/api/auth/login` → update state; return `{ error }`
- [x] `signUp(email, password, name)`: `isLoading=true` → POST `/api/auth/signup` → update state; return `{ error }`
- [x] `signOut()`: `isLoading=true` → POST `/api/auth/logout` → reset state to null
- [x] `useAuth()` hook with guard (throws outside `<AuthProvider>`)

### Step 12 — `components/login-view.tsx`
- [x] Props: `{ onNavigateToRegister(): void }`
- [x] State: email, password, error
- [x] Form: email input, password input, submit button with `isLoading` disabled state
- [x] On submit: call `signIn()`, display error if returned
- [x] All `data-testid` attributes per frontend-components.md

### Step 13 — `components/register-view.tsx`
- [x] Props: `{ onNavigateToLogin(): void }`
- [x] State: name, email, password, error
- [x] Form: name input, email input, password input (with "min 8 characters" hint), submit button
- [x] Client-side guards: name non-empty, password min 8
- [x] On submit: call `signUp()`, display error if returned
- [x] All `data-testid` attributes per frontend-components.md

### Step 14 — `components/welcome-screen.tsx` (MODIFY)
- [x] Read existing file first
- [x] Replace entirely: remove name/feature/reset logic
- [x] New implementation: local `view` state `'login' | 'register'`, default `'login'` (Q3=A)
- [x] Render `<LoginView>` or `<RegisterView>` based on `view`
- [x] Preserve existing className/styling patterns (card layout, animations) where applicable
- [x] `data-testid="welcome-screen"` retained

### Step 15 — `package.json` (MODIFY)
- [x] Read existing file first
- [x] Add `"@supabase/supabase-js": "^2"` to dependencies
- [x] Add `"@supabase/ssr": "^0"` to dependencies
- [x] Note: zod already present (^3.24.1) — no change needed

### Step 16 — `aidlc-docs/construction/BackendAuthAPI/code/code-summary.md`
- [x] List all created and modified files
- [x] Note npm install command
- [x] Requirements traceability matrix

---

## Total Steps: 16
## Files Created: 14 | Files Modified: 2
