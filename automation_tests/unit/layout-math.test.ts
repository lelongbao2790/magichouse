import { describe, test, expect } from "vitest"
import {
  clampPercent,
  computeDropPosition,
  computeRepositionPosition,
  MIN_PERCENT,
  MAX_PERCENT,
  type CanvasRect,
} from "@/components/my-house/layout-math"

// ---------------------------------------------------------------------------
// Layout position clamping — U2's share of the Unit/Helper Tests table
// (test-case-design.md): "any input delta keeps resulting x/y within [5, 95];
// placing at the exact canvas edge clamps correctly." Adapted from the Creative
// Room drag math (creative-room.tsx's handleDragEnd / handlePlacedStickerDragEnd).
// ---------------------------------------------------------------------------

const rect: CanvasRect = { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }

describe("clampPercent", () => {
  test("keeps arbitrary deltas within [5, 95]", () => {
    expect(clampPercent(-1000)).toBe(MIN_PERCENT)
    expect(clampPercent(1000)).toBe(MAX_PERCENT)
    expect(clampPercent(50)).toBe(50)
  })

  test("clamps correctly exactly at the canvas edge", () => {
    expect(clampPercent(0)).toBe(MIN_PERCENT)
    expect(clampPercent(100)).toBe(MAX_PERCENT)
    expect(clampPercent(5)).toBe(5)
    expect(clampPercent(95)).toBe(95)
  })
})

describe("computeDropPosition", () => {
  test("returns null when the drop point falls outside the canvas rect (BR-5)", () => {
    expect(computeDropPosition(-10, 50, rect)).toBeNull()
    expect(computeDropPosition(50, 200, rect)).toBeNull()
    expect(computeDropPosition(150, 50, rect)).toBeNull()
  })

  test("computes a percentage position for a drop inside the canvas", () => {
    expect(computeDropPosition(50, 50, rect)).toEqual({ x: 50, y: 50 })
  })

  test("clamps a drop right at the very edge of the canvas into [5, 95]", () => {
    expect(computeDropPosition(0, 0, rect)).toEqual({ x: MIN_PERCENT, y: MIN_PERCENT })
    expect(computeDropPosition(100, 100, rect)).toEqual({ x: MAX_PERCENT, y: MAX_PERCENT })
  })
})

describe("computeRepositionPosition", () => {
  test("any starting position + any drag delta keeps the result within [5, 95]", () => {
    expect(computeRepositionPosition(50, 50, 100000, -100000, rect)).toEqual({
      x: MAX_PERCENT,
      y: MIN_PERCENT,
    })
    expect(computeRepositionPosition(5, 95, -100000, 100000, rect)).toEqual({
      x: MIN_PERCENT,
      y: MAX_PERCENT,
    })
  })

  test("applies the offset as a percentage of the canvas rect when within bounds", () => {
    expect(computeRepositionPosition(50, 50, 10, -10, rect)).toEqual({ x: 60, y: 40 })
  })

  test("placing at the exact canvas edge clamps correctly", () => {
    expect(computeRepositionPosition(5, 95, 0, 0, rect)).toEqual({ x: 5, y: 95 })
  })
})
