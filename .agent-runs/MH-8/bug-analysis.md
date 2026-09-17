I now have a complete picture of the code. Let me produce the full analysis.

---

## Bug Analysis: MH-8 — Sign In Page Appears and Becomes Unresponsive for Already Authenticated User

---

### 1. Symptom-to-Root-Cause Trace

#### Bug 1 — Flash of Sign-In page on Back / Refresh

**Symptom:** An authenticated user who presses Back or refreshes sees the Sign-In page for ~300–1000 ms before the app auto-redirects to the Dashboard.

**Trace:**

1. `AuthProvider` (`contexts/auth-context.tsx:19`) initialises with `player = null` and `isLoading = false`. There is no "session is checking" state.
2. `isAuthenticated` is derived as `player !== null` → **immediately `false`** on every mount before the async session check resolves.
3. `HomeContent` (`app/page.tsx:25`) renders `<Dashboard>` only when `showDashboard && isAuthenticated`. On mount, both are `false`, so the else-branch runs and renders `<WelcomeScreen>` (the Sign-In page).
4. The `useEffect` on `app/page.tsx:20-23` fires and runs `fetch('/api/auth/session')`, which takes ~300–1000 ms.
5. `session/route.ts` calls `supabase.auth.getUser()`, gets a valid user, and returns the player.
6. Back in `AuthProvider`, `setPlayer(data)` is called → `isAuthenticated` becomes `true` → the `useEffect` on `page.tsx:20` sets `showDashboard = true` → Dashboard renders.
7. The Sign-In page was visible during the entire step 3–6 window. **This is the flash.**

**Root Cause 1:** `auth-context.tsx:19` — `player` starts as `null` with no `isSessionLoading` guard. `HomeContent` has no way to distinguish "unauthenticated user" from "session check still in-flight", so it renders the Sign-In page in both cases.

---

#### Bug 2 — Sign-In form becomes permanently unresponsive

**Symptom:** After the flash + auto-redirect cycle, pressing Back, entering valid credentials, and clicking Sign In does nothing.

**Trace:**

The unresponsive button is caused by a race condition that gets preserved via the browser back-forward cache (bfcache):

1. Due to Bug 1, the Sign-In page is visible during the session-check window.
2. The user sees the Sign-In page and quickly fills in credentials and clicks **Sign In**.
3. `signIn()` (`auth-context.tsx:52`) is called → `setIsLoading(true)` → the submit button becomes **`disabled={isLoading}`** (login-view.tsx:72) — button is now disabled.
4. The background session check (`GET /api/auth/session`) and the login POST (`POST /api/auth/login`) are now both in-flight simultaneously.
5. The session check resolves first → `setPlayer(data)` → `isAuthenticated = true` → `HomeContent` shows Dashboard → **`LoginView` unmounts**.
6. At this moment, `isLoading` is still `true` in the `AuthContext` state. The `signIn()` fetch is still in-flight.
7. The browser captures the page into **bfcache** at this exact instant, with `isLoading = true` frozen in React state. The in-flight `fetch` inside `signIn()` is **suspended by bfcache** — its Promise is never settled after restoration.
8. When the user presses Back (step 5 in the ticket), the browser restores the page from bfcache with `isLoading = true` still frozen.
9. The sign-in form renders with the submit button `disabled={true}` and label "Signing in…".
10. The user enters credentials and clicks the button — **nothing happens** because the button is `disabled`. No form submission, no error, no visual feedback.

**Root Cause 2 (primary):** `auth-context.tsx:19–27` — no `isSessionLoading` gate means the sign-in form is reachable during the session-check window, enabling the race in steps 3–6. This is the enabling condition for Bug 2.

**Root Cause 2 (mechanism):** bfcache freezes the page state at `isLoading = true`. Restored bfcache pages resume React rendering but do not re-execute in-flight `fetch` Promises, so `setIsLoading(false)` (in the `finally` block at `auth-context.tsx:69`) never fires.

**Supporting evidence in code:**
- `login-view.tsx:72`: `disabled={isLoading}` — button is fully disabled, no click handler fires
- `auth-context.tsx:19`: `isLoading` is initialized to `false` on a fresh mount but is **never reset** on bfcache restoration
- `auth-context.tsx:22-27`: background session `useEffect` re-fires on mount but does **not** reset `isLoading`

---

#### Bug 3 — Secondary risk: aggressive `signOut` in session route

**Trace:**

`app/api/auth/session/route.ts:12` calls `await supabase.auth.signOut()` whenever `getUser()` returns no user or an error:

```ts
if (error || !user) {
  await supabase.auth.signOut()   // ← mutates session state
  return apiSuccess(null)
}
```

If the background session check fires *concurrently* with a login POST (exactly the race in Bug 2), the sign-out response could arrive and clear the session cookie **after** the login POST has set it, stranding the user in an unauthenticated state even though login succeeded.

---

### 2. Affected Files

| File | Reason |
|------|--------|
| `contexts/auth-context.tsx` | **Primary root cause.** No `isSessionLoading` flag; `isLoading` is not reset on bfcache restoration. Both bugs originate here. |
| `app/page.tsx` (`HomeContent`) | Renders the Sign-In page immediately while session check is in-flight because it cannot distinguish "unauthenticated" from "checking". Needs to gate on `isSessionLoading`. |
| `components/login-view.tsx` | Submit button `disabled={isLoading}` is permanently disabled when bfcache restores the page with `isLoading=true`. |
| `app/api/auth/session/route.ts` | Calls `signOut()` when no session is found, creating a destructive concurrent-write risk. |

---

### 3. Minimal Fix (description only — no files modified)

**Fix A — Add `isSessionLoading` to `AuthProvider`** (`contexts/auth-context.tsx`)

Add a new state variable `isSessionLoading`, initialized to `true`. In the session-check `useEffect`, set `isSessionLoading = false` in both the `.then()` and `.catch()` paths (i.e., after the check completes regardless of result). Expose `isSessionLoading` from the context interface.

This eliminates Bug 1 (flash) because the sign-in page is never rendered until the session status is definitively known. It also eliminates Bug 2 at its root, because the sign-in form is never accessible while the session check is running, so the race condition can never occur.

**Fix B — Gate `HomeContent` on `isSessionLoading`** (`app/page.tsx`)

Consume `isSessionLoading` from `useAuth()`. While `isSessionLoading` is `true`, render `null` (or a minimal non-interactive placeholder) instead of either the Dashboard or the Sign-In page. Once `false`: if `isAuthenticated`, show Dashboard; else show the Sign-In page. This is required for Fix A to take effect in the UI.

**Fix C — Reset `isLoading` on bfcache restoration** (`contexts/auth-context.tsx`)

In a `useEffect`, add a `pageshow` event listener. When `event.persisted === true` (bfcache restoration), call `setIsLoading(false)`. This is a safety net that directly fixes Bug 2 even in edge cases where Fix A/B alone might not prevent the race (e.g., a very fast user submission before `isSessionLoading` resolves in a slow network):

```ts
useEffect(() => {
  const reset = (e: PageTransitionEvent) => {
    if (e.persisted) setIsLoading(false)
  }
  window.addEventListener('pageshow', reset)
  return () => window.removeEventListener('pageshow', reset)
}, [])
```

**Fix D — Remove destructive `signOut` from session route** (`app/api/auth/session/route.ts`)

Remove the `await supabase.auth.signOut()` call in the `if (error || !user)` branch. The session endpoint should be a **read-only** check. Calling `signOut()` when no session is found risks clearing a session that was concurrently created by a login POST. The route should simply `return apiSuccess(null)` when no session exists.

---

## Analysis Complete
