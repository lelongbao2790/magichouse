# Security Test Instructions — my-house

The Security Baseline extension is **enabled, full/blocking** for this initiative
(Requirements Q10=A). This is the Build and Test-stage re-verification, per
`security-baseline.md`'s mandate to verify compliance at every applicable stage — consolidating
the assessments already made at Requirements Analysis (`requirements.md` §6), U1's NFR
Requirements (re-verified for the `rooms` table/`GET /api/rooms` route, then again for the
`purchase_house_item` SECURITY DEFINER function), and U2's NFR Requirements.

## Dependency check

```bash
npm audit --omit=dev
```

**Result**: 6 pre-existing vulnerabilities (1 moderate, 4 high, 1 critical) in `next`
(transitively `postcss`) and `sharp` — **not introduced by this initiative**. This feature adds
**zero new npm dependencies** (confirmed: `package.json` diff is empty). Upgrading `next`/`sharp`
to remediate is out of scope for this initiative (unrelated, would require its own review) —
matches SECURITY-10's "Compliant (inherited)" assessment from Requirements Analysis.

## Auth / authorization (automated + manual review)

| Endpoint | Check |
|---|---|
| `GET /api/house-items` | 401 without a session (TC-A031). `room` defaults to `bedroom`, invalid value -> 400 (TC-A032c). |
| `GET /api/players/house-items` | 401 without a session (TC-A033b). Returns only the caller's own owned items (`auth.uid()` scoped query, no player-id parameter accepted from the client). |
| `POST /api/players/house-items` | 401 without a session. Item existence/active checked server-side before calling the purchase RPC (TC-A037). |
| `GET/PUT /api/players/house-layout` | 401 without a session. `saveLayout` rejects any `itemId` not owned by the caller before writing anything (BR-4, TC-A036d). |
| `GET /api/rooms` | 401 without a session (supplementary test in `house-items.api.test.ts`). |
| RLS (all 4 new tables) | `rooms`/`house_items`: `SELECT`-only for `authenticated`. `player_house_items`/`house_layout`: `auth.uid() = player_id` scoped. Verified in the migration file directly; live-DB confirmation is TC-M008 (`select * from pg_policies where tablename in (...)`). |
| `purchase_house_item` RPC (`SECURITY DEFINER`) | Re-checks `auth.uid() = p_player_id` as its first statement — mandatory since a `SECURITY DEFINER` function bypasses RLS. Without this check, the elevated privilege would let any authenticated caller pass an arbitrary player id. Verified by code review (`supabase/migrations/0004_house_items_schema.sql`); see `functional-design/business-rules.md` BR-3's amendment note for the full rationale. |

## Secrets

No new secrets or environment variables introduced by this initiative.

## Input validation

- `room` — `RoomSchema` (Zod enum) on every route that takes it.
- `locale` — existing `LocaleSchema`, reused (not a new schema).
- Purchase body — `BuyHouseItemSchema` (itemId required, non-empty).
- Layout body — `createHouseLayoutSchema(maxItems)`: room, and each `layoutData` entry's
  `id`/`itemId`/`x`/`y` (clamped `[5,95]`)/`scale` (clamped `[0.5,2.5]`)/`rotation` (finite),
  plus the array-length cap (BR-6). All malformed-input cases covered by TC-A037.
- No raw SQL string interpolation anywhere in the new code — all queries go through the
  Supabase client's parameterized builder or the RPC's typed arguments.

## Logging

- Errors: `console.error('[<route>]', err)`, matching every existing route — no secrets or
  full request bodies logged.
- No new logging surface introduced.

## Least privilege (SECURITY-06)

The one new privilege-relevant surface is `purchase_house_item`'s `SECURITY DEFINER` +
`GRANT EXECUTE ... TO authenticated`. Scoped to exactly what it needs (read/update
`players.coins`, read/insert `player_house_items`); not granted to `anon`; re-validates caller
identity before touching any row (see Auth table above).

## Not in scope

Rate limiting (platform-provided, per Vercel), CSRF (same-origin JSON API + Supabase cookie
auth, unchanged from every existing route), penetration testing, SAST beyond `eslint` + `tsc`
(both run clean for this initiative's files — see `build-instructions.md`).

## Overall Status
**No blocking security finding.** Full rule-by-rule compliance detail lives in
`requirements.md` §6 (original 15-rule assessment) and both units'
`nfr-requirements/nfr-requirements.md` files (re-verifications against Functional Design
output).
