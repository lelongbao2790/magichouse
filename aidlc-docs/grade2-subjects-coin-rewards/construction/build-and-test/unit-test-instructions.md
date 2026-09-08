# Unit Test Execution — grade2-subjects-coin-rewards

## Test Files

| File | Tests | Type | Covers |
|---|---|---|---|
| `automation_tests/unit/coin-rewards.test.ts` | 30 | Unit + PBT | `lib/coin-rewards.ts` — all 3 exported functions |
| `automation_tests/unit/learning-zone.test.ts` | 20 | Unit | Generator functions (boundaries, format) |
| `automation_tests/unit/learning-zone.pbt.test.ts` | 18 | PBT | Generator functions (properties) |

**Total**: 68 tests across 3 files.

## Run Tests

### All unit tests
```bash
bun test automation_tests/unit/
```
**Expected**: 68 pass, 0 fail, ~200–400ms

### Coin-rewards only
```bash
bun test automation_tests/unit/coin-rewards.test.ts
```
**Expected**: 30 pass, 0 fail

## Test Coverage

### `lib/coin-rewards.ts` — coin-rewards.test.ts

| Test Group | Count | What's Tested |
|---|---|---|
| `randomDifficulty` unit | 2 | Valid output type; all 3 values occur in 300 samples |
| `dominantDifficulty` deterministic | 10 | All 10 cases from NFR spec including tie-breaks |
| `dominantDifficulty` PBT | 7 | Output invariant, empty default, singleton, all-same, tie-break properties |
| `calculateSessionCoins` deterministic | 4 | Empty, all-easy, all-medium, all-hard ranges |
| `calculateSessionCoins` PBT | 7 | Integer output, global bounds [5,30], per-dominant ranges |

### PBT Configuration
- `numRuns: 200` per property
- Uses `fast-check` arbitraries: `fc.constantFrom('easy','medium','hard')`, `fc.array(...)`, `fc.integer(...)`

## Fix Failing Tests

If a PBT test fails, the output includes:
```
{ seed: <number>, path: "<path>", endOnFailure: true }
Counterexample: [<value>]
```
Re-run with that seed to reproduce: the seed is logged and deterministic.
