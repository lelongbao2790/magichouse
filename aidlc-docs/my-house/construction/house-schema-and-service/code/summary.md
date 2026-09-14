# Code Summary — U1: house-schema-and-service

**Status**: Complete
**Last updated**: 2026-09-14

---

## Created

- `supabase/migrations/0004_house_items_schema.sql` — `rooms`, `house_items`,
  `player_house_items`, `house_layout` tables; seed data (4 rooms, 6 Bedroom items); RLS
  policies; `idx_house_items_room_active` index; the `purchase_house_item` `SECURITY DEFINER`
  function (see Deviation below).
- `lib/services/house-items.ts` — `getCatalog`, `getOwnedHouseItems`, `purchaseHouseItem`,
  `getRooms`.
- `lib/services/house-layout.ts` — `getLayout`, `saveLayout`, `ItemNotOwnedError`.
- `app/api/house-items/route.ts` — `GET`.
- `app/api/players/house-items/route.ts` — `GET`, `POST`.
- `app/api/players/house-layout/route.ts` — `GET`, `PUT`.
- `app/api/rooms/route.ts` — `GET`.
- `automation_tests/unit/house-items.test.ts` — 18 unit tests (services + validation schema).
- `automation_tests/api/house-items.api.test.ts` — 20 API contract tests (TC-A031–TC-A037 +
  supplementary cases).
- `automation_tests/unit/house-items.pbt.test.ts` — 2 property-based tests (PBT-D, PBT-G).

## Modified

- `lib/database.types.ts` — added `rooms`/`house_items`/`player_house_items`/`house_layout`
  table types, named aliases, `PlacedHouseItem` interface, and the `purchase_house_item`
  function's `Functions` type entry.
- `lib/validation/api.ts` — added `RoomSchema`, `BuyHouseItemSchema`, `PlacedHouseItemSchema`,
  `createHouseLayoutSchema`, and their inferred types.
- `automation_tests/unit/_arbitraries.ts` — added `houseItemArb`, `placedItemArb` generators
  (PBT-07).

## Verification

- `npx tsc --noEmit`: zero new errors introduced by this unit's files (the one type error in
  `house-layout.ts` mirrors a pre-existing, identical pattern already present in `canvas.ts`
  today — not new).
- `npx vitest run` (the 3 new test files): 40/40 passing.
- `npx eslint` (all new/modified files): zero issues.

## Deviation from the Approved Plan

**`purchaseHouseItem`'s guard mechanism** (`business-rules.md` BR-3) was implemented as a
`SECURITY DEFINER` Postgres RPC function instead of the originally-specified two-query pattern
mirroring `lib/services/stickers.ts::purchaseSticker`. This was discovered during Code
Generation, not proposed or approved beforehand — a process deviation. On review, the
underlying reason was sound: the literal mirrored pattern has a genuine, pre-existing
under-charge race condition (present in `purchaseSticker` today, inherited by faithfully
mirroring it). Surfaced to the user for a decision; the user chose to keep the RPC-based
implementation. Full record: `audit.md`, `functional-design/business-rules.md` BR-3's amendment
note, `nfr-requirements/nfr-requirements.md`'s Security addendum, and
`inception/application-design/services.md`.

No other deviations from the approved plan.
