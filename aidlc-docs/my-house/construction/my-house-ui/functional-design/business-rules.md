# Business Rules — U2: my-house-ui

**Status**: Draft (Functional Design)
**Last updated**: 2026-09-14

---

## BR-1 — Room list failure handling

**Source**: Functional Design Q1=A.

- If `useRooms()` fails (network error, non-2xx response), `MyHouse` renders with an empty room
  list — no room tabs, no active room — consistent with the existing silent-fallback convention
  (Q2a=A) for catalog/layout load failures. No visible error UI, no hardcoded emergency
  fallback list.
- This is a deliberate acceptance of a degraded screen on this rare failure, matching the
  existing convention exactly rather than introducing a new fallback mechanism.

## BR-2 — Placed-item rendering trusts loaded state as-is

**Source**: Functional Design Q2=A.

- `BedroomCanvas` renders every entry in `placedItems` without cross-checking each `itemId`
  against `ownedHouseItems`. A transient mismatch between the two (caused by the two states
  loading independently) is not specially handled — it self-corrects once both loads succeed.
- This rule exists precisely because U1's BR-4 already prevents the *real* invariant violation
  (saving a layout referencing an unowned item) — U2 doesn't need a second, redundant
  enforcement of the same invariant on the read path.

## BR-3 — No resize control in V1

**Source**: Functional Design Q3=B; requirements.md FR-3.4.

- Selecting a placed item shows only a remove control. `scale` is never mutated by user
  interaction in V1 — every placed item keeps whatever `scale` value it was created with
  (default `1`, matching `HouseLayout`'s `PlacedItem.scale` field, which still exists in the
  schema per U1's design but has no client-facing mutator in this unit).

## BR-4 — Buy control state

**Source**: requirements.md FR-3.3 (already locked), restated as a concrete rule.

- An item's Buy control shows exactly one of three states: **Owned** (already in
  `ownedHouseItems` — control replaced by an "owned" indicator, not clickable), **Buyable**
  (not owned, `coins >= price` — clickable, triggers `buyHouseItem`), **Unaffordable** (not
  owned, `coins < price` — disabled, shows "need N more coins" where `N = price - coins`).
- While a purchase request is in flight for a given item, that item's control shows a
  loading/buying state and is not clickable again (prevents a double-submit race, matching
  `sticker-shop.tsx`'s `purchasingStickerId` pattern).

## BR-5 — Drag/placement bounds (client-side mirror of U1's BR-7)

**Source**: Direct precedent match (`creative-room.tsx`), no new decision.

- A drop from `MyItemsStrip` only registers as a placement if the pointer's release position
  falls within `BedroomCanvas`'s bounding rectangle; otherwise the drag is a no-op (item stays
  unplaced).
- Any placement's `x`/`y` is computed as a percentage of the canvas bounding rect and clamped
  to `[5, 95]` on creation and on every subsequent reposition-drag — this is a client-side
  UX guarantee that happens to match U1's server-side BR-7 validation, but is enforced
  independently (the client clamps for a good drag *feel*; the server validates for
  correctness regardless of what any client sends).

## BR-6 — Locked room non-interactivity

**Source**: requirements.md FR-3.2/Q8=A (already locked), restated as a concrete rule.

- A `RoomTab` with `locked = true` renders with a lock icon and "Coming soon" label and has no
  click handler wired — clicking it is a complete no-op, not merely a disabled-but-clickable
  element (avoids any focus/keyboard-activation edge case triggering a state change).

## BR-7 — Debounced autosave, last-write-wins

**Source**: Direct precedent match (`creative-room.tsx`), no new decision.

- Every mutation to `placedItems` (place, reposition, remove) restarts a 300ms debounce timer;
  only the timer that survives 300ms without another mutation actually fires the save request.
  No request cancellation, no queueing — matches `creative-room.tsx`'s existing behavior exactly,
  including its accepted risk (navigating away within the debounce window loses that last
  change — an existing, unaddressed risk this feature doesn't introduce or need to fix).
