Report exported to `docs/analysis/MH-8_analysis.md`.

---

## Jira Ticket Summary

- **Key:** MH-8
- **Summary:** Sign In Page Appears and Becomes Unresponsive for Already Authenticated User
- **Issue Type:** Bug
- **Priority:** Medium

---

## Customer Report Meaning

Two defects in the sign-in flow: (1) the sign-in page briefly flashes for an authenticated user on Back/refresh before auto-redirecting, and (2) after that cycle, the sign-in form becomes permanently unresponsive — clicking Sign In with valid credentials does nothing.

---

## Screenshot Reference

> No screenshots available.

---

## Primary Area

**`contexts/auth-context.tsx`** — missing session-loading flag.

`player` initializes to `null` → `isAuthenticated = false` immediately on every mount → the sign-in page renders before the async session check completes. This is the root of both bugs.

---

## Related Areas

| File | Reason |
|------|--------|
| `app/page.tsx` (`HomeContent`) | Renders sign-in page immediately while `isAuthenticated=false` during session check |
| `components/login-view.tsx` | Submit button controlled by `isLoading`; subject to bfcache freeze |
| `app/api/auth/session/route.ts` | Calls `signOut()` aggressively when session is missing — creates secondary concurrency risk |

---

## Likely Technical Flow

```
Mount → player=null → isAuthenticated=false → sign-in page renders  ← flash
  → useEffect → fetch /api/auth/session (~300–1000ms)
    → resolves → setPlayer(data) → isAuthenticated=true → Dashboard
  
If user submits form WHILE session check is in-flight:
  → setIsLoading(true) → signIn() POST starts
  → session check wins → Dashboard shows → LoginView unmounts
  → signIn() POST still in-flight (isLoading=true frozen in state)
  → Browser Back → bfcache restores page with isLoading=true
  → Button permanently disabled → "nothing happens"
```

---

## Likely Root Cause

### Bug 1 — Flash (`auth-context.tsx:19`)

`player` starts as `null`, there is no `isSessionLoading` flag. `HomeContent` renders the sign-in page the moment `isAuthenticated` is `false`, which is always true for ~300–1000 ms after every page load. There is no gate preventing the sign-in page from rendering during the initial session check.

### Bug 2 — Unresponsive form (`auth-context.tsx` + `login-view.tsx:72`)

A race condition between the background session check and user-initiated `signIn()` causes the form to unmount while `isLoading=true`. When the browser's back-forward cache (bfcache) snapshots the page at that moment, it freezes `isLoading=true`. The in-flight `fetch` inside `signIn()` is never resumed after bfcache restoration — `setIsLoading(false)` never fires — so the submit button (`disabled={isLoading}`) stays permanently disabled.

---

## Recommended Fix Direction

1. **Add `isSessionLoading=true` to `AuthProvider`** (`auth-context.tsx`) — set to `false` in both the `.then()` and `.catch()` of the session check. Expose it from the context. In `HomeContent`, render neither the sign-in page nor the dashboard while `isSessionLoading=true`. This eliminates the flash and prevents the race condition (form is never shown during the session check window).

2. **Add a `pageshow` bfcache listener** in `AuthProvider` — on `event.persisted`, call `setIsLoading(false)`. This safety-nets the unresponsive form even if timing allows the race condition to occur.

3. **Remove aggressive `signOut()` in `session/route.ts:12`** — the session endpoint should be read-only. Calling `signOut()` when no session is found risks clearing a concurrently-created session cookie from a login POST.

---

## Risks / Regression Areas

- Logout flow uses the same `isLoading` — keep `isSessionLoading` as a separate flag.
- Register view (`components/register-view.tsx`) shares the same `AuthProvider` and will benefit from the same fixes.
- Unauthenticated first-time users must see the sign-in form promptly once `isSessionLoading` becomes `false`.

---

## Analysis Complete
