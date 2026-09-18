# Bug Memory

---

[RESOLVED 2026-09-18] MH-7

- Root cause: Three separate issues. RC-2: `upsertPlayer` included `coins: 0` in upsert payload, resetting balance on conflict. RC-3: `addCoins` in `lib/services/player.ts` used a non-atomic read-then-write (`getPlayer()` + `update()`), causing race-condition coin loss when two requests ran concurrently. RC-4: `CoinContext.addCoins` swallowed API errors silently (`.catch(() => {})`), leaving an optimistic state that diverged from the DB — visible as a balance change on next login.
- Fix: (1) Removed `coins: 0` from `upsertPlayer` upsert payload — column has `DEFAULT 0` in schema. (2) Added `increment_player_coins` Postgres RPC (`supabase/migrations/0005_increment_coins_rpc.sql`) using `UPDATE players SET coins = coins + p_amount` (single atomic SQL); `addCoins` in service now calls this RPC instead of read+write. (3) `CoinContext.addCoins` captures `previousCoins` before optimistic update and restores both state and `localStorage` in the catch handler.
- Files: `lib/services/player.ts`, `contexts/coin-context.tsx`, `supabase/migrations/0005_increment_coins_rpc.sql`, `lib/database.types.ts`, `automation_tests/unit/player-service.test.ts`, `automation_tests/unit/coin-context.test.tsx`
- Risk: `increment_player_coins` is `SECURITY DEFINER` — safe because it explicitly checks `auth.uid() = p_player_id` before mutating. `buySticker` and `buyHouseItem` in `coin-context.tsx` also swallow errors but were out of scope.
- Verification: `pnpm test` — 263 tests pass. 14 new regression tests TC-U-MH7-1 through TC-U-MH7-14 all pass.

---

[RESOLVED 2026-09-17] MH-8

- Root cause: `player` in `AuthProvider` initialises to `null`, making `isAuthenticated = false` immediately on every mount with no `isSessionLoading` guard. `HomeContent` rendered the sign-in page during the async session check window (~300–1000ms). A secondary race condition between the session check and a user-initiated `signIn()` left `isLoading = true` frozen in bfcache, permanently disabling the submit button.
- Fix: (1) Added `isSessionLoading = true` to `AuthProvider`; session check sets it `false` in `.finally()`. `HomeContent` returns `null` while `isSessionLoading`. (2) Added `pageshow` bfcache handler in `AuthProvider` to reset `isLoading = false` on `event.persisted`. (3) Removed aggressive `signOut()` from `GET /api/auth/session` — endpoint made read-only.
- Files: `contexts/auth-context.tsx`, `app/page.tsx`, `app/api/auth/session/route.ts`, `automation_tests/unit/auth-context.test.tsx`
- Risk: Brief blank screen (~300–1000ms) on initial page load for unauthenticated users — acceptable trade-off.
- Verification: `pnpm test` — 249 tests pass. 6 new regression tests TC-U-MH8-1 through TC-U-MH8-6 all pass.
