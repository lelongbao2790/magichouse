# Integration Test Instructions — my-house

There is no automated integration harness in this project (no live-DB test runner) — matches
the `subject-content-db` precedent. These scenarios verify U1 (schema/service/API) and U2 (UI)
working together against a real Supabase project with the migration applied, and double as the
manual checklist's live-environment verification (`MANUAL-TEST-CHECKLIST.md`).

## Setup

```bash
supabase db push       # apply 0004_house_items_schema.sql to the linked project
npm run dev            # http://localhost:3000
```

## Scenario 1 — Catalog + room list → UI (the full read path)

- **Steps**: log in; open My House.
- **Expected**: the Bedroom room tab is active; the other 3 rooms show locked; the catalog
  grid shows the 6 seeded items with correct emoji/price; the coin balance matches
  `/api/players/me`.
- **Covered by**: TC-E018, TC-E019.

## Scenario 2 — Purchase → ownership → coin balance (across U1 and U2)

- **Steps**: note the balance; buy the Lamp (40 coins).
- **Expected**: `POST /api/players/house-items` deducts exactly 40 via the
  `purchase_house_item` RPC; the Lamp appears in My Items; the balance shown matches the new
  value; a second purchase attempt of the same item is a no-op (still owned, same balance).
- **Covered by**: TC-E020, TC-A034, TC-A035, PBT-D, PBT-G.

## Scenario 3 — Place → autosave → reload (the full write + persistence path)

- **Steps**: drag the Lamp onto the Bedroom canvas; wait >300ms (the debounce window); reload
  the page; reopen My House.
- **Expected**: the Lamp appears at the same position after reload — confirms
  `PUT /api/players/house-layout` actually persisted and `GET` actually restores it, not just
  that the mocked unit/API tests pass.
- **Covered by**: TC-E022, TC-E024, PBT-F (round-trip, exercised against the mock — this
  scenario is the live-DB confirmation of the same property).

## Scenario 4 — Coin balance shared across all 4 dashboard sections (regression)

- **Steps**: from Dashboard, check the balance in Sticker Shop, then My House, then buy a house
  item, then check Creative Room's balance.
- **Expected**: identical balance at each point, reflecting the My House purchase once made —
  confirms `coin-context.tsx`'s extension didn't fork the coin balance into a second, divergent
  piece of state.
- **Covered by**: TC-E026, TC-E027.

## Cleanup

Remove any test-account purchases/placements if the linked Supabase project is shared
(non-dedicated test account): `DELETE FROM player_house_items WHERE player_id = '<test-uuid>'`
and clear the corresponding `house_layout` row, or simply re-use a disposable test account per
existing project convention.
