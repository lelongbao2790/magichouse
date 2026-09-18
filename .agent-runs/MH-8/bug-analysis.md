I now have a complete picture of the code. Let me produce the full analysis.

---

## Bug Analysis: MH-8 — Sign In Page Appears and Becomes Unresponsive for Already Authenticated User

---

### 1. Symptom-to-Root-Cause Trace

#### Bug 1 — Flash of Sign-In page on Back / Refresh

**Symptom:** An authenticated user who presses Back or refreshes sees the Sign-In page for ~300–1000 ms before the app auto-redirects to the Dashboard.

**Trace:**

### Root Cause

The bug is in `app/page.tsx` lines 18–23.

```tsx
const [showDashboard, setShowDashboard] = useState(false)

useEffect(() => {
  if (isAuthenticated) setShowDashboard(true)
  else setShowDashboard(false)
}, [isAuthenticated])
```

**The dependency is `[isAuthenticated]`, a boolean derived from `player !== null`.**

Here is the sequence that triggers the bug:

| Step | `isAuthenticated` | `showDashboard` | Displayed |
|---|---|---|---|
| 1. User signs in | `false → true` | effect fires → `true` | Dashboard |
| 2. User presses Back (calls `onBack` → `setShowDashboard(false)`) | still `true` | `false` | Login page |
| 3. User re-submits credentials | `true` (unchanged!) | `false` | Login page (stuck) |

At step 3, `signIn()` succeeds and `setPlayer(data)` is called in `auth-context.tsx:65`. However, `player` was already non-null, so `isAuthenticated` remains `true` — **its value does not change**. Because `useEffect` is gated on `[isAuthenticated]` and that value has not toggled, the effect never fires. `showDashboard` is never set back to `true`. The render guard at line 25 (`if (showDashboard && isAuthenticated)`) stays `false`, leaving the user stranded on the login screen.

Note: the login API call itself succeeds (no error from the server); the bug is purely in the client-side state machine.

---

### Affected Files

| File | Reason |
|---|---|
| `app/page.tsx` | Contains the broken `useEffect` dependency. This is where the fix must go. |
| `contexts/auth-context.tsx` | Involved in the flow (provides `isAuthenticated` and `signIn`), but is not the source of the bug — it behaves correctly. |
| `components/login-view.tsx` | Where the user submits credentials; calls `signIn`. No fix needed here. |

---

### Proposed Minimal Fix

**File:** `app/page.tsx`, lines 20–23.

Change the `useEffect` dependency from `[isAuthenticated]` to `[player]`:

```tsx
// BEFORE
useEffect(() => {
  if (isAuthenticated) setShowDashboard(true)
  else setShowDashboard(false)
}, [isAuthenticated])

// AFTER
useEffect(() => {
  if (isAuthenticated) setShowDashboard(true)
  else setShowDashboard(false)
}, [isAuthenticated, player])
```

Or more directly, replace the dependency with `[player]` alone (since `isAuthenticated` is just `player !== null`, `player` carries all the information):

```tsx
useEffect(() => {
  if (player) setShowDashboard(true)
  else setShowDashboard(false)
}, [player])
```

**Why this fixes it:** When the user re-submits credentials, `signIn()` calls `setPlayer(data)` with a fresh object from the API response. `player` changes to a new reference even though the user is the "same" player. This triggers the `useEffect`, which sets `showDashboard(true)`, satisfying the `showDashboard && isAuthenticated` guard and rendering the Dashboard.

The single-line dependency change (`[isAuthenticated]` → `[player]`) is the only modification required. No other files need changes.

---

## Analysis Complete
