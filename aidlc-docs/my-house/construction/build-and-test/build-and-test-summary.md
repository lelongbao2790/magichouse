# Build and Test Summary — my-house

**Status**: Awaiting user approval
**Last updated**: 2026-09-14

---

## Build Status

| | |
|---|---|
| **Build tool** | Next.js 16.2.0 (`next build --webpack`) |
| **Build status** | ✅ Success |
| **New routes registered** | `/api/house-items`, `/api/players/house-items`, `/api/players/house-layout`, `/api/rooms` |
| **Lint** | ✅ `eslint .` — 0 errors, 17 warnings (all pre-existing patterns, e.g. `react-hooks/set-state-in-effect`, already present elsewhere in the codebase and downgraded to `warn`) |
| **Typecheck** | ✅ zero new errors from this initiative's files (`tsc --noEmit`). Pre-existing, unrelated errors remain in `data/stickers.ts`, `lib/services/{canvas,player}.ts`, `debug-hook-test.ts` — confirmed unchanged by this initiative. |
| **Lockfiles** | `package-lock.json` updated by `npm install` (no dependency changes — `package.json` diff is empty). `pnpm`/`bun` binaries unavailable in this build environment; not needed regardless since no dependency changed. |
| **CI config** | `.github/workflows/ci.yml`: `INITIATIVE` env var `subject-content-db` -> `my-house`; Pages index card text refreshed. `vitest.config.ts` needed no change (its `include`/coverage globs already cover `lib/services/**`, `app/api/**`, `components/**`). |

## Test Execution Summary

### Unit + API tests (Vitest)
| | |
|---|---|
| **Full suite total** | **225** |
| **Passed** | 225 |
| **Failed** | 0 |
| **Files** | 20 |
| **New/modified this initiative** | 4 files, 50 tests (`house-items.test.ts` 18, `layout-math.test.ts` 8, `house-items.pbt.test.ts` 4, `house-items.api.test.ts` 20) + `_arbitraries.ts` (+2 generators, not tests themselves) |
| **Status** | ✅ Pass |

### Property-Based tests (fast-check — full/blocking, Q12=A)
| Group | Property | Status |
|---|---|---|
| PBT-D | Purchase affordability invariant: balance never negative, every attempt fully succeeds or fully fails | ✅ |
| PBT-E | Placement position bounds: any drag delta lands within `[5, 95]` | ✅ |
| PBT-F | Layout save/load round-trip preserves `layoutData` exactly | ✅ |
| PBT-G | Idempotent ownership: `buy(buy(x)) = buy(x)` | ✅ |
| **Total PBT** | | **4 tests, all pass** |

**No blocking PBT findings.**

### API tests
| | |
|---|---|
| **Coverage** | All 4 new routes' full contract (401/400/404/success shapes), purchase-guard/idempotency, layout ownership/count/bounds validation, room-list auth+locale |
| **Status** | ✅ Pass — 20/20 |

### E2E tests (Playwright — Chromium)
| | |
|---|---|
| **New** | `automation_tests/e2e/my-house.spec.ts` — TC-E018–E027 (10 cases) |
| **Existing** | `grade2-subjects.spec.ts`, `subject-content.spec.ts`, `smoke.spec.ts` — unchanged, expected to keep passing |
| **Status** | ⏳ **Not run** — no dev server/linked Supabase project in this build environment. Verified to compile/lint cleanly and follow existing conventions. Expected green post-deploy, matching the `subject-content-db` precedent. CI's `e2e` job is `continue-on-error: true`. |

### Manual verification (TC-M)
`MANUAL-TEST-CHECKLIST.md` at the repo root — **3 new items appended**, all pending deploy:
- TC-M006 content review of the 6 seeded Bedroom items
- TC-M007 drag-and-drop feel on a real mobile screen size
- TC-M008 migration applied correctly on the live Supabase project (row counts, RLS policies)

### Security (full/blocking extension)
See `security-test-instructions.md` — **no blocking finding**. One new privilege-relevant
surface (`purchase_house_item`'s `SECURITY DEFINER` function) reviewed and confirmed safe
(re-checks caller identity, scoped `GRANT EXECUTE`). Dependency audit shows 6 pre-existing
vulnerabilities in `next`/`sharp`, none introduced by this initiative (zero new dependencies).

### Coverage
Not separately re-measured against the repo's `lines: 80` threshold in this pass — matches the
pre-existing, structural, not-enforced-in-CI gap already noted in `subject-content-db`'s Build
and Test summary (the `unit` CI job runs `vitest run` without `--coverage`). This initiative's
new logic (`lib/services/house-items.ts`, `lib/services/house-layout.ts`,
`components/my-house/**`) is covered by the `vitest.config.ts` include globs and has dedicated
test files for every new module.

## Deviations Carried Into This Stage (both resolved, documented, no open architecture questions)

1. **U1**: `purchaseHouseItem` uses a `SECURITY DEFINER` Postgres RPC function
   (`purchase_house_item`) instead of the originally-approved two-query pattern mirroring
   `stickers.ts` — fixes a genuine, pre-existing race condition in the literal mirrored
   pattern. User-approved. `functional-design/business-rules.md` BR-3 (U1).
2. **U2**: 3 minor `frontend-components.md` doc corrections (no `onPlace` prop on
   `BedroomCanvas`; `PlacedItemView` type; test file location) — implementation-detail gaps in
   the doc, not architecture changes. `functional-design/frontend-components.md` (U2).

## Overall Status

| | |
|---|---|
| **Build** | ✅ Success |
| **Automated tests (unit + API + PBT)** | ✅ 225/225 pass (this initiative's 54 tests included) |
| **E2E** | ⏳ deferred to post-deploy (accepted, matches precedent) |
| **Manual checklist** | ⏳ 3 items pending deploy |
| **Security** | ✅ No blocking finding |
| **Ready for Operations** | ✅ code-complete. **Release depends on**: (1) `supabase db push`
  (applies `0004_house_items_schema.sql`), (2) no new env vars needed, (3) working through
  `MANUAL-TEST-CHECKLIST.md`'s new TC-M006–008 after CI is green on main. |

## Next Steps
1. Merge the branch -> CI runs lint + unit + API (green expected) and, on main, E2E (may be
   red one cycle, non-blocking per `continue-on-error: true`).
2. `supabase db push` against `eoelyqphaixgqlkyoxau`.
3. Deploy.
4. Work through `MANUAL-TEST-CHECKLIST.md` (TC-M006–TC-M008, plus a re-check of TC-M001–M005
   from prior initiatives per the checklist's own standing instructions).
