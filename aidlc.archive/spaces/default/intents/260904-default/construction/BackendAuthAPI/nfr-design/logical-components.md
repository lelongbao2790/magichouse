# Logical Components — Unit 2: BackendAuthAPI

## New Files to Create

| Component | Path | Type | Purpose |
|---|---|---|---|
| Admin Supabase Client | `lib/supabase/admin.ts` | Utility | Service-role client for Admin API calls (login pre-check) |
| Server Supabase Client | `lib/supabase/server.ts` | Utility | SSR cookie-based client for API routes |
| Browser Supabase Client | `lib/supabase/client.ts` | Utility | Singleton browser client for AuthContext |
| API Response Helper | `lib/api-response.ts` | Utility | `apiSuccess` / `apiError` typed response builders |
| Validation Schemas | `lib/validation/api.ts` | Utility | `SignupSchema`, `LoginSchema` (more added in Unit 3) |
| Player Service (partial) | `lib/services/player.ts` | Service | `getPlayer`, `upsertPlayer` (remaining methods in Unit 3) |
| Signup Route | `app/api/auth/signup/route.ts` | API Route | POST — creates auth user + player row |
| Login Route | `app/api/auth/login/route.ts` | API Route | POST — admin pre-check + signInWithPassword |
| Logout Route | `app/api/auth/logout/route.ts` | API Route | POST — clears session cookie |
| Session Route | `app/api/auth/session/route.ts` | API Route | GET — returns Player or null; clears stale cookie |
| Auth Context | `contexts/auth-context.tsx` | React Context | Session state, signIn/signUp/signOut methods |
| Login View | `components/login-view.tsx` | UI Component | Email + password login form |
| Register View | `components/register-view.tsx` | UI Component | Name + email + password registration form |

## Files to Modify

| Component | Path | Change |
|---|---|---|
| Welcome Screen | `components/welcome-screen.tsx` | Refactor: replace name-entry UI with LoginView/RegisterView switcher |

---

## No Runtime Infrastructure Required

| Type | Status | Reason |
|---|---|---|
| Message queue | Not needed | Auth is synchronous |
| Cache | Not needed | Session state lives in cookie + AuthContext; no server-side cache |
| Background worker | Not needed | Session refresh handled by @supabase/ssr middleware |
| Rate limiter | Not needed | Q2=A — Supabase platform handles this |

---

## Component Dependency Map

```
app/api/auth/signup/route.ts
    ├─ lib/supabase/server.ts       (SSR client — sets session cookie)
    ├─ lib/validation/api.ts        (SignupSchema)
    ├─ lib/api-response.ts          (apiSuccess / apiError)
    └─ lib/services/player.ts       (upsertPlayer)

app/api/auth/login/route.ts
    ├─ lib/supabase/admin.ts        (Admin API pre-check — getUserByEmail)
    ├─ lib/supabase/server.ts       (SSR client — signInWithPassword + sets cookie)
    ├─ lib/validation/api.ts        (LoginSchema)
    ├─ lib/api-response.ts
    └─ lib/services/player.ts       (getPlayer)

app/api/auth/logout/route.ts
    ├─ lib/supabase/server.ts       (SSR client — signOut clears cookie)
    └─ lib/api-response.ts

app/api/auth/session/route.ts
    ├─ lib/supabase/server.ts       (SSR client — getUser + stale-cookie signOut)
    ├─ lib/api-response.ts
    └─ lib/services/player.ts       (getPlayer)

contexts/auth-context.tsx
    └─ lib/supabase/client.ts       (browser client — only for client-side session sync)

components/welcome-screen.tsx
    ├─ components/login-view.tsx
    └─ components/register-view.tsx

components/login-view.tsx
    └─ contexts/auth-context.tsx    (signIn method)

components/register-view.tsx
    └─ contexts/auth-context.tsx    (signUp method)
```

---

## Key Design Decision: Two Supabase Clients

| Client | File | Key Used | Purpose |
|---|---|---|---|
| SSR Server | `lib/supabase/server.ts` | Anon key | All route handlers — reads/writes session cookie |
| Admin | `lib/supabase/admin.ts` | Service role key | Login pre-check only — Admin API access |
| Browser | `lib/supabase/client.ts` | Anon key | AuthContext browser-side session sync |

The admin client is **never used from the browser** and is only imported by
`app/api/auth/login/route.ts`. The service role key must never appear in any
`NEXT_PUBLIC_*` variable or browser-accessible code.

---

## Execution Flow: First App Load (Q2=B — No Spinner)

```
Browser loads app
    │
    ├─ AuthContext mounts → { session: null, player: null, isLoading: false }
    ├─ WelcomeScreen renders immediately (Login view default — Q3=A)
    │
    └─ useEffect fires → fetch GET /api/auth/session
           │
           ├─ [valid session] → AuthContext: session + player set → Dashboard shown
           └─ [no session / stale cookie] → stale cookie cleared → WelcomeScreen stays
```
