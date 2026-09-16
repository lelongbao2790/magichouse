# Services — my-house

**Status**: Draft (Application Design)
**Last updated**: 2026-09-13

Per approved design answer Q2=A: **two services**, mirroring the exact split of the analog
feature (`stickers.ts` / `canvas.ts`).

---

## 1. `lib/services/house-items.ts`

**Responsibility**: Catalog retrieval, ownership retrieval, and purchase orchestration for house
items. Direct structural analog of `lib/services/stickers.ts`.

| Function | Signature | Purpose |
|---|---|---|
| `getCatalog` | `(supabase: Supabase, room: string, locale: 'vi' \| 'en'): Promise<HouseItemRow[]>` | Active catalog rows for one room, ordered by `sort_order`, each mapped to a single localized `name` field (selected from `name_vi`/`name_en` per `locale`) — per FR-2.1, matching the `getSubjectContent(supabase, key, locale)` precedent from `subject-content-db`, not the client-side `nameMap` pattern |
| `getOwnedHouseItems` | `(supabase: Supabase, userId: string): Promise<string[]>` | Owned item IDs for a player (mirrors `getOwnedStickers`) |
| `purchaseHouseItem` | `(supabase: Supabase, userId: string, itemId: string, price: number): Promise<{ newCoinBalance: number }>` | **Amended 2026-09-14 (Code Generation)**: calls `supabase.rpc('purchase_house_item', ...)`, a `SECURITY DEFINER` Postgres function that runs the ownership check, affordability guard, and idempotent ownership insert atomically in one transaction with row locking — not the literal `purchaseSticker`-mirroring two-query pattern originally specified, which was found to have a genuine under-charge race condition (see U1's `functional-design/business-rules.md` BR-3 for the full record) |
| `getRooms` | `(supabase: Supabase, locale: 'vi' \| 'en'): Promise<RoomTab[]>` | **Added 2026-09-13** (Functional Design U1 clarification) — all rows from the new `rooms` lookup table, each mapped to `{ id, label, emoji, locked: !is_unlocked }` with `label` selected from `label_vi`/`label_en` per `locale`, same server-side selection pattern as `getCatalog` |

**Errors**: Imports and reuses `InsufficientFundsError` from `lib/services/stickers.ts` for the
guard-failure case (Functional Design Q5=A — one shared error type across the app, not a
duplicate).

**Route consumers**: `app/api/house-items/route.ts` (GET — reads `?room=` and `?locale=`,
validating locale via the existing `LocaleSchema` from `lib/validation/api.ts`, same as
`app/api/subjects/[key]/questions/route.ts`), `app/api/players/house-items/route.ts` (GET, POST),
`app/api/rooms/route.ts` (GET — added 2026-09-13, same auth + `?locale=` convention as the other
two GET routes).

---

## 2. `lib/services/house-layout.ts`

**Responsibility**: Get/save a player's placed-items layout for one room. Direct structural
analog of `lib/services/canvas.ts`, generalized with a `room` parameter since `house_layout` is
keyed by `(player_id, room)` rather than `player_id` alone (per requirements FR-1.3, schema is
multi-room-ready now).

| Function | Signature | Purpose |
|---|---|---|
| `getLayout` | `(supabase: Supabase, userId: string, room: string): Promise<PlacedHouseItem[]>` | Returns `layout_data` for `(userId, room)`, or `[]` if no row exists yet (mirrors `getCanvas`'s `PGRST116` handling) |
| `saveLayout` | `(supabase: Supabase, userId: string, room: string, layoutData: PlacedHouseItem[]): Promise<void>` | Upserts `(player_id, room)` row with new `layout_data` + `updated_at` (mirrors `saveCanvas`) |

**Route consumers**: `app/api/players/house-layout/route.ts` (GET, PUT).

---

## Orchestration Notes

- Both services take a request-scoped `SupabaseClient<Database>` as their first argument,
  matching every existing service in the codebase — no shared "orchestrating" service layer is
  needed since each API route already does its own auth check + single service call, exactly
  like `stickers`/`canvas` today.
- No service directly calls another service; the two are independent (buying an item and placing
  it are separate user actions/API calls, exactly as ownership and canvas placement are for
  stickers today).
