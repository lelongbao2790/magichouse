# MH-8 Bug Analysis — Sign In Page Appears and Becomes Unresponsive for Already Authenticated User

**Date:** 2026-09-17  
**Analyst:** Claude Sonnet 4.6  
**Status:** RESOLVED 2026-09-17

---

## Ticket

- **Key:** MH-8
- **Summary:** Sign In Page Appears and Becomes Unresponsive for Already Authenticated User
- **Issue Type:** Bug
- **Priority:** Medium

---

## Screenshot Reference

Screenshots were not available. Analysis is based on ticket description, comments, and direct code inspection.

---

## Steps to Reproduce

1. Open the application and sign in with a valid account.
2. Verify the user is navigated to the main dashboard.
3. Press the browser Back button or refresh the page.
4. *(Inferred)* Observe: Sign In page appears briefly, then auto-redirects to dashboard after ~500ms.
5. Press Back again.
6. Enter the same valid email and password.
7. Click Sign In.
8. *(Inferred)* Observe: Nothing happens — button remains visually active but click produces no response.

**Expected:** Authenticated users should never see the Sign In page. Clicking Sign In with valid credentials must navigate to the dashboard.

**Actual:**
- Bug 1: Sign In page flashes briefly before redirecting.
- Bug 2: After the Back→Submit cycle, the form becomes permanently unresponsive.

---

## Context

| File | Role |
|------|------|
| `contexts/auth-context.tsx` | Auth state provider — root cause |
| `app/page.tsx` (`HomeContent`) | Consumes auth state, decides what to render |
| `components/login-view.tsx` | Sign-in form — button gated by `isLoading` |
| `app/api/auth/session/route.ts` | Server session check endpoint |

---

## Likely Flow (Current Broken State)

```
Mount
  → player = null → isAuthenticated = false → Sign In page renders  ← Flash (Bug 1)
  → useEffect fires → fetch /api/auth/session (async, 300–1000ms)
    → resolves → setPlayer(data) → isAuthenticated = true → Dashboard

If user submits form WHILE session check is in-flight:
  → setIsLoading(true) → signIn() POST starts
  → session check resolves first → setPlayer(data) → Dashboard → LoginView unmounts
  → signIn() POST still in-flight
  → Browser Back → bfcache may restore page with isLoading = true frozen
  → Button permanently disabled → Sign In does nothing (Bug 2)
```

---

## Fan-Out Findings

### UI / Component (`app/page.tsx`)
`HomeContent` reads `isAuthenticated` and `showDashboard`. On mount, `showDashboard = false` and `isAuthenticated = false` simultaneously — so the sign-in form renders before the async session check completes. No loading gate exists to suppress this.

### State / Context (`contexts/auth-context.tsx`)
- `player` starts as `null` (line 18) → `isAuthenticated = false` immediately.
- `isLoading` (line 19) controls only the sign-in/sign-up form button.
- **There is no `isSessionLoading` flag** to indicate the background session check is in-flight. This is the root cause of Bug 1.
- The background session check (lines 22–27) completes asynchronously with no way for consumers to know it is pending.

### API Route (`app/api/auth/session/route.ts`)
- Calls `supabase.auth.signOut()` when `getUser()` returns no user (lines 10–13). While this clears stale cookies, it could interfere with concurrent sign-in requests — a secondary risk.
- Does not cause Bug 1 or Bug 2 directly; the issue is entirely in how the loading state is surfaced to the UI.

### Component (`components/login-view.tsx`)
- `isLoading` is sourced from `useAuth()` (line 11) and disables the submit button when `true` (line 73).
- If `isLoading` is `true` when bfcache restores the page snapshot, the button remains disabled permanently.

### Correct Implementation Reference
Other contexts (e.g., `coin-context`) use explicit loading flags before rendering dependent UI. This pattern is already established in the project.

### Bug Memory
No prior entry for this area found.

---

## Fan-In Decision

Both bugs share the same root cause: missing `isSessionLoading` flag.

- Bug 1 is eliminated by not rendering the sign-in page until the session check completes.
- Bug 2 is eliminated because the form is never accessible while the session check is in-flight, so the user cannot trigger the race condition. The bfcache scenario is addressed by a `pageshow` event handler resetting `isLoading`.

---

## Root Cause

**`contexts/auth-context.tsx` line 18–27:** `player` initialises to `null`, making `isAuthenticated = false` on every mount. The async session check has no corresponding boolean flag (`isSessionLoading`). Consumers have no way to distinguish "not authenticated" from "not yet checked", so the sign-in page renders immediately on every mount.

---

## Rejected Hypotheses

| Hypothesis | Reason Rejected |
|-----------|-----------------|
| Server-side session issue | `apiSuccess(null)` is returned correctly; data reaches the client |
| Cookie not being set | User is redirected to dashboard after session check, confirming auth works |
| `signOut()` in session route causing issue | Only fires when `getUser()` fails; not in the user's authenticated path |

---

## Proposed Fix

### Change 1 — `contexts/auth-context.tsx`

Add `isSessionLoading: boolean` to context type and state.

```tsx
const [isSessionLoading, setIsSessionLoading] = useState(true)

useEffect(() => {
  fetch('/api/auth/session')
    .then(r => r.json())
    .then(({ data }) => { if (data) setPlayer(data) })
    .catch(() => {})
    .finally(() => setIsSessionLoading(false))
}, [])
```

Add `pageshow` bfcache handler to reset `isLoading` on cache restore:

```tsx
useEffect(() => {
  const handlePageShow = (e: PageTransitionEvent) => {
    if (e.persisted) setIsLoading(false)
  }
  window.addEventListener('pageshow', handlePageShow)
  return () => window.removeEventListener('pageshow', handlePageShow)
}, [])
```

Expose `isSessionLoading` in context value.

### Change 2 — `app/page.tsx` (`HomeContent`)

Guard the welcome/sign-in render with `isSessionLoading`:

```tsx
const { isAuthenticated, isSessionLoading } = useAuth()

if (isSessionLoading) return null   // or a minimal spinner
```

This prevents the sign-in page from flashing during the session check.

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Brief blank screen during session check (~300–1000ms) | Low | Acceptable UX trade-off; better than the sign-in flash |
| `pageshow` handler not available in SSR | None | Handler uses `window` inside `useEffect` — client-only, safe |
| Logout flow affected | None | `signOut()` sets `player = null`; `isSessionLoading` stays `false` after first check |
| `isSessionLoading` API surface change | Low | Only `HomeContent` consumes it; context change is additive |

---

## Confidence

**High** — root cause is clear from code inspection; fix is minimal and additive.

---

## Fix Implementation

### Files Changed

| File | Change |
|------|--------|
| `contexts/auth-context.tsx` | Added `isSessionLoading` state (starts `true`, set to `false` in `.finally()` of session check); added `pageshow` bfcache handler to reset `isLoading`; exposed `isSessionLoading` in context value and type |
| `app/page.tsx` | `HomeContent` returns `null` while `isSessionLoading` is `true`, preventing sign-in page flash |
| `app/api/auth/session/route.ts` | Removed aggressive `signOut()` call when session is absent — endpoint is now read-only |
| `automation_tests/unit/auth-context.test.tsx` | 6 new regression tests (TC-U-MH8-1 through TC-U-MH8-6) covering session loading guard, bfcache reset, and error paths |

---

## Verification

- `pnpm test` — 249 tests pass, 0 failures
- All 6 new regression tests pass
- Existing test suite unaffected

---

## Final Status

RESOLVED — Both bugs fixed. Authenticated users no longer see the sign-in page flash, and the form cannot become permanently unresponsive via bfcache.
