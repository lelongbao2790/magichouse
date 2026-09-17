## Cycle 0

tomation_tests/unit/coin-rewards.test.ts`
- Replaced TC-U001/TC-U002 (`randomDifficulty` tests) with tests for `scoreDifficulty` and `timesTableDifficulty`
- Updated TC-U020–TC-U023 to assert exact fixed values and add a **MH-7 determinism regression** test (TC-U020)

### `automation_tests/unit/learning-zone.test.ts`
- Added MH-7 regression tests (TC-U031b/c, TC-U033b/c, TC-U036b/c) verifying that the `difficulty` field in generated questions reflects actual operand magnitude, not a random draw
