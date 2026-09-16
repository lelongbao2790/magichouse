// Pure position math shared by MyHouse (strip-drop placement, BR-5) and BedroomCanvas
// (placed-item reposition drag, BR-5) — kept in its own module (no React) so it's
// directly unit-testable, matching the "layout position clamping" row in
// test-case-design.md's Unit/Helper Tests table. Mirrors creative-room.tsx's inline
// handleDragEnd/handlePlacedStickerDragEnd math exactly, just extracted to a helper.

export const MIN_PERCENT = 5
export const MAX_PERCENT = 95

export function clampPercent(value: number): number {
  return Math.max(MIN_PERCENT, Math.min(MAX_PERCENT, value))
}

export interface CanvasRect {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

/**
 * A drop from MyItemsStrip only registers as a placement if the release point falls
 * within the canvas's bounding rectangle (BR-5) — returns null otherwise (no-op drag).
 * Otherwise returns the drop position as a clamped [5, 95] percentage of the rect.
 */
export function computeDropPosition(
  clientX: number,
  clientY: number,
  canvasRect: CanvasRect,
): { x: number; y: number } | null {
  if (
    clientX < canvasRect.left ||
    clientX > canvasRect.right ||
    clientY < canvasRect.top ||
    clientY > canvasRect.bottom
  ) {
    return null
  }

  const x = clampPercent(((clientX - canvasRect.left) / canvasRect.width) * 100)
  const y = clampPercent(((clientY - canvasRect.top) / canvasRect.height) * 100)
  return { x, y }
}

/**
 * Computes a placed item's new clamped x/y (BR-5) from a drag offset expressed as a
 * percentage of the canvas rect — used when repositioning an already-placed item.
 */
export function computeRepositionPosition(
  currentX: number,
  currentY: number,
  offsetX: number,
  offsetY: number,
  canvasRect: CanvasRect,
): { x: number; y: number } {
  const x = clampPercent(currentX + (offsetX / canvasRect.width) * 100)
  const y = clampPercent(currentY + (offsetY / canvasRect.height) * 100)
  return { x, y }
}
