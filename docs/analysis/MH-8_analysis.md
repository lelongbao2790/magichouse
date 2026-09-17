# MH-8 - Bug Analysis Report

## 1. Jira Ticket Summary

- **Key:** MH-8
- **Summary:** Sign In Page Appears and Becomes Unresponsive for Already Authenticated User
- **Issue Type:** Bug
- **Priority:** Medium

---

## 2. Customer Report Meaning

The customer reports two related defects in the sign-in / authentication flow:

1. **Flash of the sign-in page for authenticated users.** After a successful sign-in, pressing the browser Back button or refreshing the page briefly shows the sign-in page before the app automatically redirects to the main (dashboard) page a few seconds later.

2. **Sign-in form becomes permanently unresponsive.** If the user presses Back again after the auto-redirect, the sign-in page is shown. Entering valid credentials and clicking Sign In does nothing — no navigation, no error, and the user stays on the sign-in page.

---

## 3. Screenshot Reference

> No screenshots available. Analysis is based on ticket text and source code.

---

## 4. Simplified Explanation

> After logging in, the app briefly shows the login page by mistake when you press Back or refresh — even though you're still logged in. After a few seconds, it corrects itself and shows the main page. But if you press Back one more time and try to log in again, the Sign In button stops working and nothing happens.

The login page should never appear for someone already logged in. And once it does appear and you try to log in, the button should always work.

---

## 5. Steps to Reproduce

1. Open the application at `/` and sign in with valid credentials.
2. Confirm you are on the main/dashboard page.
3. Press the browser Back button **or** refresh the page (`F5`/`Ctrl+R`).
4. **Observe:** The Sign In page appears for a few seconds, then the app redirects automatically to the dashboard.
5. Press the browser Back button again (returning to `/`).
6. Enter the same valid email and password.
7. Click **Sign In**.
8. **Observe:** Nothing happens. The user remains on the Sign In page with no error message and no navigation.

**Expected (steps 3–4):** An authenticated user should never see the Sign In page. The redirect to the dashboard should be instant (no flash).

**Expected (steps 6–8):** Signing in with valid credentials should successfully navigate to the dashboard.

---

## 6. Primary Area

**`contexts/auth-context.tsx`** — The `AuthProvider` is the root cause owner.

It initializes `player` as `null` with no "session loading" flag, causing `isAuthenticated` to be `false` on every mount. The async session check (`useEffect`) takes 300–1000 ms to resolve, during which the sign-in page renders. This single missing flag is the direct cause of Bug 1 (flash) and the enabling condition for Bug 2 (race/unresponsive form).

---

## 7. Related Areas

| File | Why affected |
|------|-------------|
| `app/page.tsx` (`HomeContent`) | Consumes `isAuthenticated` from `AuthProvider`. Renders the sign-in page immediately while session check is in flight. |
| `components/login-view.tsx` | Rendered during the flash window. The `isLoading` flag controls the submit button. Subject to bfcache freeze (see root cause 2). |
| `app/api/auth/session/route.ts` | Calls `supabase.auth.signOut()` aggressively when no user is found, which can interfere with a concurrently-firing login POST. |

---

## 8. Likely Technical Flow

```
Browser loads / navigates to /
  → app/page.tsx (Home)
    → AuthProvider mounts → player = null, isAuthenticated = false
    → HomeContent renders sign-in page (WelcomeScreen / LoginView)  ← BUG: visible immediately
    → useEffect fires → fetch /api/auth/session
      → app/api/auth/session/route.ts → supabase.auth.getUser()
        → session valid → returns player
      → AuthProvider: setPlayer(data) → isAuthenticated = true
      → HomeContent useEffect: setShowDashboard(true)
      → Dashboard renders  ← delayed by async, causing the "flash"

If user submits LoginView while session check is in-flight:
  → signIn() → setIsLoading(true) → fetch /api/auth/login
  → session check resolves first → Dashboard shows → LoginView unmounts
  → signIn() fetch still in-flight with isLoading = true
  → signIn() completes → setPlayer(data), setIsLoading(false) (in finally)
  → On next Back navigation (bfcache): isLoading may be frozen as true → button permanently disabled
```

---

## 9. Relevant Files / Classes / Modules

| File | Role |
|------|------|
| `contexts/auth-context.tsx` | `AuthProvider`: owns `player`, `isLoading`, `isAuthenticated`, and the background session check `useEffect` |
| `app/page.tsx` | `HomeContent`: reads `isAuthenticated`, controls `showDashboard`, renders sign-in or dashboard |
| `components/welcome-screen.tsx` | Renders `LoginView` or `RegisterView` |
| `components/login-view.tsx` | Sign-in form; `handleSubmit` calls `signIn()`; submit button disabled by `isLoading` |
| `app/api/auth/session/route.ts` | Session validation endpoint; calls `signOut()` aggressively when session is missing |
| `app/api/auth/login/route.ts` | Sign-in endpoint; creates new Supabase session |
| `lib/supabase/server.ts` | Server-side Supabase client using `@supabase/ssr` with cookie store |

---

## 10. Likely Root Cause

### Root Cause 1 — Flash of sign-in page (Bug 1)

In `contexts/auth-context.tsx:19`, `player` is initialized to `null`:

```tsx
const [player, setPlayer] = useState<Player | null>(null)
```

There is no "session is loading" state. The derived value `isAuthenticated: player !== null` is therefore `false` on every mount before the async session check resolves.

In `app/page.tsx:25`, `HomeContent` renders the sign-in page immediately whenever `isAuthenticated` is `false`:

```tsx
if (showDashboard && isAuthenticated) {
  return <Dashboard ... />
}
// sign-in page renders here while session check is still in flight
```

The `useEffect` that transitions `showDashboard` to `true` (line 20–23) does not fire until `isAuthenticated` changes — which only happens after the `/api/auth/session` fetch completes (~300–1000 ms). During that window, the sign-in page is visible to an authenticated user.

### Root Cause 2 — Unresponsive sign-in form (Bug 2)

This is caused by a race condition between the background session check and a user-initiated sign-in, **combined with browser back-forward cache (bfcache)**.

**The race condition:**

When the user sees the sign-in page (due to Bug 1) and quickly submits the form:

1. `signIn()` is called → `setIsLoading(true)` → submit button is **disabled**
2. Background session check resolves simultaneously → `setPlayer(data)` → `isAuthenticated=true` → Dashboard renders, `LoginView` unmounts
3. `signIn()` fetch is still in-flight with `isLoading=true` captured in closure
4. `signIn()` eventually resolves → `setIsLoading(false)` is called in the `finally` block (line 69, `auth-context.tsx`)

So far the state is recovered. But:

**The bfcache freeze:**

When the page navigates away while `signIn()` is in-flight (the Dashboard was shown by the session check winning the race), the browser may snapshot the page state into the back-forward cache **at the moment `isLoading=true`**. The in-flight `fetch` inside `signIn()` is frozen — its Promise is never resumed on bfcache restoration.

On the next Back navigation (step 5 in the ticket), bfcache restores the page with:
- `isLoading = true` (frozen, never reset)
- Submit button: `disabled={isLoading}` → **permanently disabled**
- Button label: "Signing in…"

The user can type credentials and click the button, but the button is disabled. From the user's perspective: **nothing happens**.

**Supporting evidence in the code:**

- `login-view.tsx:72`: `disabled={isLoading}` — button is fully disabled when `isLoading=true`
- `auth-context.tsx:19`: `isLoading` initializes to `false` on fresh mount but is restored as-is from bfcache
- `auth-context.tsx:22–27`: background session check `useEffect` re-fires on mount but does NOT reset `isLoading`

---

## 11. Risks / Regression Areas

- **Logout flow**: The fix must not break `signOut()`, which also sets `isLoading`. The "session loading" guard must be independent of the `isLoading` flag used for mutations.
- **First-time users (unauthenticated)**: The loading guard must resolve promptly when there is no session, so legitimate unauthenticated users are not blocked from the sign-in form indefinitely.
- **Register flow** (`components/register-view.tsx`): The register flow shares the same `AuthProvider` and `isLoading` flag. Any changes to `isLoading` initialization or bfcache handling will affect it equally.
- **Coin and language contexts**: These are nested inside `AuthProvider` in `app/page.tsx`. Any change to when `AuthProvider` exposes its loading state must not prevent these contexts from initializing.
- **`app/api/auth/session/route.ts` aggressive signOut**: The `supabase.auth.signOut()` call on line 12 of session route fires when `getUser()` returns no user. If a background session check fires concurrently with a login POST, the signOut response could arrive after the login response, clearing the newly-set session cookies. This is a secondary risk and should be reviewed.

---

## 12. Recommended Fix Direction

### Fix 1 — Add `isSessionLoading` state to `AuthProvider` (fixes Bug 1 and prevents Bug 2)

In `contexts/auth-context.tsx`:

- Add a new state variable `isSessionLoading`, initialized to `true`.
- In the session check `useEffect`, set `isSessionLoading = false` in both the `.then()` and `.catch()` callbacks (always clear it after the check completes, regardless of result).
- Expose `isSessionLoading` from the context.

In `app/page.tsx` (`HomeContent`):

- While `isSessionLoading` is `true`, render nothing (or a minimal loading indicator) instead of the sign-in page.
- Once `isSessionLoading` is `false`: if `isAuthenticated`, show Dashboard; else show the sign-in page.

This eliminates the flash (Bug 1) because the sign-in page is never rendered until the session status is known. It also prevents Bug 2 because the sign-in form is never accessible while the session check is running, eliminating the race condition entirely.

### Fix 2 — Handle bfcache restoration to reset `isLoading` (directly fixes Bug 2 as a safety net)

In `contexts/auth-context.tsx`, add a `pageshow` event listener:

```
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Page was restored from bfcache — reset transient loading state
    setIsLoading(false)
  }
})
```

This resets `isLoading` to `false` whenever the page is restored from the bfcache, ensuring the submit button is never permanently disabled after bfcache restoration. This is a safety net even if Fix 1 is applied.

### Fix 3 — Remove aggressive `signOut` in session route (secondary, reduces risk)

In `app/api/auth/session/route.ts`, remove the `await supabase.auth.signOut()` call on line 12. The session endpoint should only read session state, not mutate it. The aggressive signOut creates a risk of clearing a session that was just set by a concurrent login POST.

---

## 13. Missing / Uncertain Information

- No screenshots available to confirm visual state of the unresponsive form (e.g., whether the button shows "Signing in…" or appears normal but non-functional).
- Whether the bug reproduces consistently across all browsers (bfcache behavior differs: Firefox uses bfcache aggressively; Chrome uses it under certain conditions; Safari is similar to Chrome). If the bug only reproduces in Firefox, bfcache is confirmed as the mechanism.
- Whether there is any browser console error (e.g., a React warning about state updates on unmounted components) when the form becomes unresponsive — this would help confirm which scenario is occurring.
- The `components/register-view.tsx` file was not read; it may share the same `isLoading` path and could have the same unresponsive-form bug.
