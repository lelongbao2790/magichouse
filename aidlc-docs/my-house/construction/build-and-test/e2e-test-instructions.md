# E2E Test Instructions — my-house

## Run E2E Tests
```bash
npm run dev &
npx wait-on http://localhost:3000
npm run test:e2e   # playwright test, Chromium only per playwright.config.ts
```

## Test Files
- `automation_tests/e2e/my-house.spec.ts` (new, 10 cases — TC-E018 through TC-E027)
- Existing specs unchanged: `grade2-subjects.spec.ts`, `subject-content.spec.ts`,
  `smoke.spec.ts` — re-run as regression, no changes expected or needed.

## What is covered
| Case | Scenario |
|---|---|
| TC-E018 | My House opens to Bedroom by default, coin balance visible |
| TC-E019 | Kitchen/Living Room/Garden locked and non-interactive |
| TC-E020 | Buying an affordable item deducts coins, moves it to My Items |
| TC-E021 | Purchase blocked when unaffordable |
| TC-E022 | Dragging an owned item places it; placed item can be repositioned |
| TC-E023 | Removing a placed item returns it to My Items, still owned |
| TC-E024 | Reload restores previously bought items and saved layout |
| TC-E025 | First-time player sees empty Bedroom + empty My Items |
| TC-E026 | Coin balance consistent across Shop/Creative Room/My House (regression) |
| TC-E027 | Dashboard navigation to/from My House alongside existing sections (regression) |

## Status (this session)
⏳ **Not run** — this sandboxed build environment has no running dev server or linked
Supabase project to exercise a real login/purchase/layout flow against. Verified instead that
the spec file compiles cleanly (`tsc --noEmit`), lints cleanly (`eslint`), and follows the
existing spec conventions (`data-testid` selectors, `topUpCoins` helper, Chromium-only project).
Matches the `subject-content-db` precedent's E2E status at the same stage — expected green
post-deploy. The CI `e2e` job is `continue-on-error: true` (per `.github/workflows/ci.yml`),
so a first-run red E2E job does not block the pipeline.

## Preconditions for a real run
- `supabase db push` applied (see `integration-test-instructions.md`)
- E2E test account credentials set (`E2E_USERNAME`/`E2E_PASSWORD`)
- The `topUpCoins(page, amount)` helper (calls `/api/players/coins`) is used by
  purchase-related cases to guarantee sufficient balance before each test, per
  `test-case-design.md`'s Q5=A decision

## Expected result once run
- **Total tests**: 10 (this initiative) + existing suite unchanged
- **All pass**: expected yes, pending a real deploy
