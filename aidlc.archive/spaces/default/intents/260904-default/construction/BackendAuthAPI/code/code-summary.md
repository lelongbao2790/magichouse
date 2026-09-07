# Code Summary — Unit 2: BackendAuthAPI

## Files Created (14)

| File | Purpose |
|---|---|
| `lib/supabase/server.ts` | SSR cookie-based Supabase client (per-request) |
| `lib/supabase/admin.ts` | Service-role admin client (login email pre-check only) |
| `lib/supabase/client.ts` | Browser singleton Supabase client |
| `lib/api-response.ts` | `apiSuccess` / `apiError` typed response builders |
| `lib/validation/api.ts` | `SignupSchema` + `LoginSchema` (Zod) |
| `lib/services/player.ts` | `getPlayer` + `upsertPlayer` (Unit 3 adds remaining methods) |
| `app/api/auth/signup/route.ts` | POST — validate → signUp → upsertPlayer → player |
| `app/api/auth/login/route.ts` | POST — admin pre-check → signInWithPassword → player |
| `app/api/auth/logout/route.ts` | POST — signOut, always 200 |
| `app/api/auth/session/route.ts` | GET — getUser → player or null; clears stale cookie |
| `contexts/auth-context.tsx` | `AuthProvider` + `useAuth` hook |
| `components/login-view.tsx` | Email + password sign-in form |
| `components/register-view.tsx` | Name + email + password registration form |
| `aidlc-docs/construction/BackendAuthAPI/code/code-summary.md` | This file |

## Files Modified (2)

| File | Change |
|---|---|
| `components/welcome-screen.tsx` | Refactored to login/register switcher (login default) |
| `package.json` | Added `@supabase/supabase-js ^2` + `@supabase/ssr ^0` |

---

## Install Command

```bash
npm install
# Installs @supabase/supabase-js and @supabase/ssr added to package.json
```

---

## Requirements Traceability

| Requirement | Implemented By |
|---|---|
| FR-01: Email/password auth | `signup/route.ts`, `login/route.ts`, `logout/route.ts`, `session/route.ts` |
| FR-02 partial: Player row on signup | `upsertPlayer` called in `signup/route.ts` |
| FR-11: Auth-gated access | `AuthContext.isAuthenticated` — gates Dashboard rendering (Unit 4 wires this) |
| SECURITY-05: Input validation | `SignupSchema` + `LoginSchema` in every auth route |
| SECURITY-08: Server-side session | `supabase.auth.getUser()` in every authenticated route |
| SECURITY-12: Auth hardening | Password min 8; Admin pre-check for login; Supabase bcrypt + rate limiting |
| SECURITY-15: Error isolation | try/catch on all routes; no stack traces to client |

---

## Key Design Decisions

| Decision | Implementation |
|---|---|
| Q1=B (specific login errors) | Admin pre-check via `listUsers` → "Email not registered" vs "Wrong password" |
| Q2=B (immediate WelcomeScreen) | `AuthContext` starts with `isLoading: false`; session check runs in `useEffect` |
| Q3=A (login view first) | `WelcomeScreen` defaults `view` state to `'login'` |
| Admin pre-check scale note | `listUsers` fetches all users — acceptable at this app's scale (< 1000 users) |
