# Bug Memory

---

[RESOLVED 2026-09-17] MH-8

- Root cause: `player` in `AuthProvider` initialises to `null`, making `isAuthenticated = false` immediately on every mount with no `isSessionLoading` guard. `HomeContent` rendered the sign-in page during the async session check window (~300–1000ms). A secondary race condition between the session check and a user-initiated `signIn()` left `isLoading = true` frozen in bfcache, permanently disabling the submit button.
- Fix: (1) Added `isSessionLoading = true` to `AuthProvider`; session check sets it `false` in `.finally()`. `HomeContent` returns `null` while `isSessionLoading`. (2) Added `pageshow` bfcache handler in `AuthProvider` to reset `isLoading = false` on `event.persisted`. (3) Removed aggressive `signOut()` from `GET /api/auth/session` — endpoint made read-only.
- Files: `contexts/auth-context.tsx`, `app/page.tsx`, `app/api/auth/session/route.ts`, `automation_tests/unit/auth-context.test.tsx`
- Risk: Brief blank screen (~300–1000ms) on initial page load for unauthenticated users — acceptable trade-off.
- Verification: `pnpm test` — 249 tests pass. 6 new regression tests TC-U-MH8-1 through TC-U-MH8-6 all pass.
