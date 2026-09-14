# API Test Instructions — my-house

## Purpose
Validate the 4 new API route contracts — accepted inputs, rejected inputs, and response
shapes. These tests run via the unit test runner (Vitest, mocked Supabase client), no live
server required.

## Run API Tests
```bash
npm test   # automation_tests/api/** is included in vitest.config.ts's `include` glob already
```

## Test Files
- `automation_tests/api/house-items.api.test.ts` (20 tests) — covers all 4 routes:
  - `GET /api/house-items` (catalog)
  - `GET /api/players/house-items` (owned items) / `POST` (purchase)
  - `GET /api/players/house-layout` (get layout) / `PUT` (save layout)
  - `GET /api/rooms` (room list)

## What is covered
| Case ID | Scenario |
|---|---|
| TC-A031 | `GET /api/house-items` unauthenticated -> 401 |
| TC-A032 (+b/c/d) | Valid room -> documented shape; room/locale defaults; invalid room -> 400; invalid locale -> 400 |
| TC-A033 (+b) | `GET /api/players/house-items` returns owned IDs; unauthenticated -> 401 |
| TC-A034 | Insufficient funds rejected server-side, no ownership row, balance unchanged |
| TC-A035 | Purchase success + idempotent repeat purchase |
| TC-A036 (+b/c/d) | Layout PUT/GET round-trip; invalid room on GET/PUT -> 400; ownership violation -> 400 |
| TC-A037 | Non-existent itemId -> 404; missing itemId -> 400; malformed layout item (missing x/y, out-of-range x/y) -> 400 |
| (supplementary) | `GET /api/rooms` unauthenticated -> 401; authenticated success; invalid locale -> 400 |

## Expected result
- **Total tests**: 20
- **All pass**: yes (independently re-run this session)

## Note on validation-schema factory
`PUT /api/players/house-layout` builds its Zod schema per-request
(`createHouseLayoutSchema(activeCatalogCount)`) because BR-6's item-count bound depends on the
target room's active catalog size, which isn't known at module-load time. This is exercised by
TC-A036c/d and TC-A037's malformed-input cases.
