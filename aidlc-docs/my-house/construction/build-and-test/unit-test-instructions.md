# Unit Test Execution — my-house

## Run Unit Tests
```bash
npm test               # vitest run (includes automation_tests/unit/** and automation_tests/api/**)
npm run test:coverage  # with coverage
```

## Test Files (this initiative)
| File | Covers |
|---|---|
| `automation_tests/unit/house-items.test.ts` | `getCatalog`, `getOwnedHouseItems`, `purchaseHouseItem`, `getRooms` (U1 services), `getLayout`/`saveLayout` (U1), `createHouseLayoutSchema` (validation) |
| `automation_tests/unit/layout-math.test.ts` | `clampPercent`, `computeDropPosition`, `computeRepositionPosition` (U2's pure drag/placement math, BR-5) |
| `automation_tests/unit/house-items.pbt.test.ts` | PBT-D, PBT-E, PBT-F, PBT-G (see PBT section below) |
| `automation_tests/unit/_arbitraries.ts` | `houseItemArb`, `placedItemArb` generators (shared) |

## Review Test Results
- **Expected**: 30 tests across the 3 files above (`house-items.test.ts` 18, `layout-math.test.ts`
  8, `house-items.pbt.test.ts` 4 — PBT-D/E/F/G), 0 failures.
- **Actual (this session)**: full suite `npm test` — **225/225 passing** (20 test files),
  which includes this initiative's tests alongside every pre-existing test file, none of which
  regressed.
- **Test Report Location**: CI produces `test_report/my-house/unit/index.html` (per
  `.github/workflows/ci.yml`, `INITIATIVE` updated to `my-house` this initiative).

## Fix Failing Tests
None failing at time of this Build and Test pass. If a future change breaks one:
1. Review the Vitest output (test name identifies the file + assertion).
2. Cross-reference the failing test's BR-# comment against
   `construction/house-schema-and-service/functional-design/business-rules.md` or
   `construction/my-house-ui/functional-design/business-rules.md` to confirm expected behavior.
3. Fix code, rerun `npm test` until green.
