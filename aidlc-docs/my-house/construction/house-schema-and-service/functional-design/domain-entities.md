# Domain Entities — U1: house-schema-and-service

**Status**: Draft (Functional Design)
**Last updated**: 2026-09-13

Technology-agnostic entity definitions. Concrete Postgres/TypeScript shapes are Code
Generation's job; this describes the domain concepts and their relationships.

---

## Entities

### `Room`
A place within a player's house that can hold decorated items. **Added as a first-class
entity** per Functional Design Q1=B (a lookup table, not a `CHECK`-constrained string).

| Field | Type | Notes |
|---|---|---|
| `id` | identifier | One of `bedroom`, `kitchen`, `living_room`, `garden` (V1's 4 rooms) |
| `labelVi` / `labelEn` | text | Display name, both languages |
| `isUnlocked` | boolean | Whether the room is playable; only `bedroom` is `true` in V1 |

### `HouseItem`
A catalog entry: a piece of furniture/decoration that can be bought.

| Field | Type | Notes |
|---|---|---|
| `id` | identifier | |
| `room` | `Room` reference | The room this item belongs to (V1: always `bedroom`) |
| `nameVi` / `nameEn` | text | Localized name |
| `emoji` | text | Visual representation (V1: emoji-only, per requirements Q2=A) |
| `price` | integer | Coin cost, > 0 |
| `isActive` | boolean | Whether it's currently purchasable (mirrors `stickers`' implicit always-active today, added for parity with `is_active` conventions elsewhere in the schema) |
| `sortOrder` | integer | Display order within its room |

### `PlayerHouseItem`
Ownership record: a player owns a `HouseItem` once purchased.

| Field | Type | Notes |
|---|---|---|
| `playerId` | `Player` reference | |
| `itemId` | `HouseItem` reference | |
| `purchasedAt` | timestamp | |

**Identity**: the pair `(playerId, itemId)` is the entity's identity — a player can own a given
item at most once (purchasing twice is a no-op, not a second record).

### `HouseLayout`
A player's arrangement of owned items within one room.

| Field | Type | Notes |
|---|---|---|
| `playerId` | `Player` reference | |
| `room` | `Room` reference | |
| `layoutData` | ordered collection of `PlacedItem` | See below |
| `updatedAt` | timestamp | |

**Identity**: the pair `(playerId, room)` is the entity's identity — one layout per player per
room (V1 only ever populates the `bedroom` row).

### `PlacedItem` (value object, element of `HouseLayout.layoutData`)
One item's placement within a room's layout.

| Field | Type | Notes |
|---|---|---|
| `id` | identifier | Placement instance ID (distinct from `itemId` — an item can be un-placed and re-placed, getting a new placement `id` each time, matching `creative_canvas`'s `PlacedSticker` convention) |
| `itemId` | `HouseItem` reference | Must refer to an item the owning player owns (see Business Rules) |
| `x`, `y` | percentage (0-100) | Position within the room canvas, clamped to `[5, 95]` |
| `scale` | number | Visual size multiplier |
| `rotation` | number | Visual rotation |

---

## Relationships

```
Room 1 ----< * HouseItem
Room 1 ----< * HouseLayout  (via HouseLayout.room)
Player 1 ----< * PlayerHouseItem >---- 1 HouseItem
Player 1 ----< 1..* HouseLayout  (one per room the player has touched)
HouseLayout 1 ----< * PlacedItem  (embedded, not a separate table — JSONB array)
PlacedItem *  ---->  1 HouseItem  (via itemId; must be owned by the layout's player)
```

### Text Alternative

```
- A Room has many HouseItems (its catalog) and at most one HouseLayout per Player.
- A Player owns many HouseItems through PlayerHouseItem records (many-to-many).
- A HouseLayout belongs to one Player and one Room, and contains many embedded PlacedItems.
- Each PlacedItem references exactly one HouseItem, which must be one the layout's Player owns.
```

---

## Cross-Reference to Existing Analogs

| This feature's entity | Existing analog | Relationship |
|---|---|---|
| `Room` | (none — new concept) | N/A |
| `HouseItem` | `Sticker` (`stickers` table) | Structural analog, +`room` FK, +bilingual name columns instead of a single `name` |
| `PlayerHouseItem` | `PlayerSticker` (`player_stickers` table) | Direct structural analog |
| `HouseLayout` | `CreativeCanvas` (`creative_canvas` table) | Structural analog, generalized with a `room` key instead of being implicitly single-room |
| `PlacedItem` | `PlacedSticker` (`CanvasItem` type) | Direct structural analog |
