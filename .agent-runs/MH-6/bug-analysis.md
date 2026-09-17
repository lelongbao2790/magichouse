I have everything I need for the complete analysis.

---

## Bug Analysis: MH-6 — Drag and Drop Item Jumps to Wrong Position

### Phase 1: Root Cause Investigation

#### Error Mechanics — Tracing the Symptom

The bug occurs exclusively on the **second drag of a placed item** (repositioning), not on the initial drop from the strip. This is the critical diagnostic signal.

**The culprit is a Framer Motion accumulated transform state problem.**

#### How Framer Motion Positions Draggable Elements

When `drag` is enabled on a `motion.div`, Framer Motion applies **two layers** of position to the element:

1. **CSS `left/top`** — set by React state, defines the "anchor" position in percentage
2. **Framer Motion's internal `x`/`y` motion values** — a pixel-based CSS transform applied ON TOP of the CSS anchor, tracking the drag displacement

The element's visual position = `left: x%` + FP internal `translateX/Y(px)`.

After drag ends, Framer Motion's internal `x`/`y` motion values **are NOT reset to zero**. They persist at whatever pixel offset the drag ended at.

#### Step-by-Step Trace of the Bug

**Setup:** Canvas is 500×500px. Item initially placed at `x=40%, y=40%` (200px, 200px from top-left).

**State after initial drop from strip:**
- Stored: `x=40, y=40`
- FP internal: `x=0, y=0`
- Visual position: `left: 40%` + `translate(0,0)` = **200px, 200px** ✓

**User drags the placed item 50px right:**
- `info.offset = { x: 50, y: 0 }` (Framer Motion measures from visual drag start)
- `computeRepositionPosition(40, 40, 50, 0, rect)` → `newX = 40 + (50/500)*100 = 50`
- State updates: stored `x=50, y=40`

**After re-render:**
- CSS: `left: 50%` = 250px
- FP internal: `x=50` (NOT reset — persists from drag)
- Visual position: `250px + 50px` = **300px** ← WRONG (should be 250px)
- **Item jumps to 300px instead of remaining at 250px**

**User drags again (grab at visual 300px, trying to drag 30px right):**
- `info.offset = { x: 30, y: 0 }` (from the wrong visual grab point)
- `computeRepositionPosition(50, 40, 30, 0, rect)` → `newX = 50 + (30/500)*100 = 56`
- FP internal now: `x = 50+30 = 80` (accumulated)
- Visual position: `left: 56%` (280px) + FP `translate(80px)` = **360px** ← further wrong

The error compounds with every additional drag.

#### Why the `key` Doesn't Save It

The `motion.div` uses `key={placed.id}` (`bedroom-canvas.tsx:66`). Since `placed.id` is stable across repositions (the placement isn't replaced, just updated), React never unmounts/remounts the element. Framer Motion's internal state is tied to the component instance, so it persists across every re-render.

---

### Phase 2: Affected Files

| File | Lines | Why Affected |
|------|-------|--------------|
| `components/my-house/bedroom-canvas.tsx` | 62–113 | **Primary bug site.** The `motion.div` map renders placed items with CSS `left/top` positioning AND Framer Motion `drag`, but never resets FP's `x`/`y` motion values after position state updates. |
| `components/creative-room.tsx` | 249–319 | **Same bug pattern** — uses identical `motion.div` + CSS `left/top` + `drag` + `info.offset` math. The ticket is filed against My House, but this file will exhibit the same jump behavior when repositioning placed stickers. |
| `components/my-house/layout-math.ts` | 51–61 | **Not buggy**, but its correctness depends on a precondition: `info.offset` must measure displacement from the element's CSS `left/top` anchor (i.e., FP's internal state must be 0 at drag start). The fix must preserve this precondition. |

---

### Phase 3: Proposed Minimal Fix

**File to change:** `components/my-house/bedroom-canvas.tsx`

**Approach:** Extract the per-item rendering into a `PlacedItemTile` subcomponent that owns `useMotionValue` hooks and resets them synchronously after each position update.

**Why this approach:**
- `useMotionValue` cannot be called inside a `.map()` (Rules of Hooks)
- A subcomponent is the idiomatic Framer Motion solution — each placed item gets its own controlled `x`/`y` motion values
- `useLayoutEffect` (not `useEffect`) resets them synchronously before the browser paints, preventing any visual flash at the wrong position

**The fix:**

Add `useMotionValue` and `useLayoutEffect` to the imports, then replace the inline `motion.div` loop in `BedroomCanvas` with a new `PlacedItemTile` component defined in the same file:

```tsx
// New component — add above BedroomCanvas
function PlacedItemTile({ placed, isSelected, onDragEnd, onSelect, onRemove }) {
  const motionX = useMotionValue(0)
  const motionY = useMotionValue(0)

  // Reset FP's accumulated pixel transform to 0 whenever the stored position
  // is updated (after each drag end). useLayoutEffect fires before paint so
  // the element never flashes at the wrong position.
  useLayoutEffect(() => {
    motionX.set(0)
    motionY.set(0)
  }, [placed.x, placed.y, motionX, motionY])

  return (
    <motion.div
      key={placed.id}
      className={...}
      style={{
        left: `${placed.x}%`,
        top: `${placed.y}%`,
        transform: "translate(-50%, -50%)",
        x: motionX,   // Framer Motion uses these as its controlled drag values
        y: motionY,
      }}
      drag
      dragMomentum={false}
      dragElastic={0}
      whileDrag={{ scale: 1.1, zIndex: 100 }}
      onDragEnd={(_, info) => onDragEnd(placed.id, info)}
      onClick={...}
    >
      ...
    </motion.div>
  )
}
```

Then in `BedroomCanvas`, replace `placedItems.map((placed) => <motion.div ...>)` with `placedItems.map((placed) => <PlacedItemTile key={placed.id} placed={placed} ... />)`.

**The same fix should be applied to `creative-room.tsx`** for the sticker reposition case, even though it is not explicitly in scope for MH-6.

**What does NOT change:**
- `computeRepositionPosition` in `layout-math.ts` — the math is correct as-is once FP state is clean at drag start
- `computeDropPosition` — unaffected (handles strip-to-canvas drops, not repositioning)
- `MyItemsStrip`, `MyHouse` orchestrator, `RoomNav`, `ItemCatalog` — all unaffected

---

## Analysis Complete