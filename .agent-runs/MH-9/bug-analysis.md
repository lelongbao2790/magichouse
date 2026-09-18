The root cause is immediately clear. Here is the full analysis.

---

## Bug Analysis: MH-9 — Vercel Build Error (`isSessionLoading is not defined`)

### Symptom

Vercel's static pre-render of `/` fails at build time with:

```
ReferenceError: isSessionLoading is not defined
  at gF (.next/server/app/page.js:19:175793)
```

### Root Cause

**`app/page.tsx`, line 17 vs line 25.**

`HomeContent` calls `useAuth()` but only destructures two values:

```ts
// line 17
const { player, isAuthenticated } = useAuth()
```

On line 25 it then references a variable that was never declared in this scope:

```ts
if (isSessionLoading) return null   // ← ReferenceError: isSessionLoading is not defined
```

`isSessionLoading` exists in `AuthContextType` (defined in `contexts/auth-context.tsx` line 9) and is provided by `AuthProvider` (line 99), so the context is correct. The consumer (`HomeContent`) simply forgot to include `isSessionLoading` in its destructuring assignment.

This error appears at **build time** (static prerender) because Next.js executes the component module during the export phase. The missing variable causes a hard `ReferenceError` that exits the build worker.

### Affected Files

| File | Reason |
|---|---|
| `app/page.tsx` | **Only affected file.** Line 25 references `isSessionLoading` which was never destructured from `useAuth()` on line 17. |

`contexts/auth-context.tsx` is **not** affected — it correctly declares, manages, and exposes `isSessionLoading`.

### Proposed Minimal Fix

In `app/page.tsx`, line 17, add `isSessionLoading` to the `useAuth()` destructuring:

**Before:**
```ts
const { player, isAuthenticated } = useAuth()
```

**After:**
```ts
const { player, isAuthenticated, isSessionLoading } = useAuth()
```

That single token addition is the complete fix. No other files need to change.

## Analysis Complete
