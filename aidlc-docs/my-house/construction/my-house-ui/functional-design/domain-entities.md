# Domain Entities — U2: my-house-ui

**Status**: Draft (Functional Design)
**Last updated**: 2026-09-14

U2 consumes U1's domain entities (`Room`, `HouseItem`, `PlayerHouseItem`, `HouseLayout`,
`PlacedItem` — see U1's `domain-entities.md`) rather than redefining them. This file adds only
the **client-only** concepts that exist purely as UI/interaction state, not persisted anywhere.

---

## Client-Only Entities (transient, in-memory)

### `RoomTab` (view model of `Room`)
| Field | Type | Notes |
|---|---|---|
| `id` | identifier | Same as `Room.id` |
| `label` | text | `Room.labelVi`/`labelEn`, already locale-selected server-side |
| `emoji` | text | Per-room visual — client-owned, not server-driven (rooms don't carry an emoji field; `RoomNav` maps `id` to a fixed emoji, e.g. `bedroom` -> 🛏) |
| `locked` | boolean | `!Room.isUnlocked` |

### `UnplacedOwnedItem` (derived view model)
The set of `HouseItem`s the player owns (`PlayerHouseItem`) but that don't currently appear in
`HouseLayout.layoutData` for the active room — computed client-side (Q2=A: no server
cross-check, just a client-side set difference against whatever `placedItems`/`ownedHouseItems`
currently hold, regardless of momentary inconsistency between the two).

### `SelectedPlacement` (UI state)
Which one `PlacedItem.id` (if any) is currently selected, showing its remove control (and, per
Q3=B, *not* a resize control in V1). At most one at a time; `null` when nothing is selected.

### `DragSession` (transient UI state)
Exists only while a drag gesture is in progress (from either `MyItemsStrip` or a placed item in
`BedroomCanvas`) — which item is being dragged, and (for a from-strip drag) whether the pointer
is currently over the canvas. Never persisted; fully reset on drag end regardless of outcome.

---

## Relationship to U1's Entities

```
Room (U1) ----maps-to----> RoomTab (client view model)
HouseItem (U1) ----filtered-by-ownership----> UnplacedOwnedItem (client derived set)
PlacedItem (U1, embedded in HouseLayout) ----referenced-by----> SelectedPlacement (client UI state)
(none, ephemeral) ----------------------------> DragSession (client UI state only)
```

### Text Alternative

```
- RoomTab is U2's rendering of a U1 Room (label/lock state already server-resolved).
- UnplacedOwnedItem is a client-computed set: owned HouseItems minus those already placed.
- SelectedPlacement tracks which PlacedItem (from HouseLayout.layoutData) is UI-selected.
- DragSession is purely transient UI state with no server counterpart.
```
