"use client"

import { forwardRef, useLayoutEffect } from "react"
import { motion, type PanInfo, useMotionValue } from "framer-motion"
import { Trash2 } from "lucide-react"
import type { PlacedHouseItem } from "@/lib/database.types"
import { computeRepositionPosition } from "./layout-math"

// Client-only view: a PlacedHouseItem enriched with the emoji to render, resolved by
// MyHouse against the active room's catalog (PlacedHouseItem itself carries only
// itemId, not emoji — U1 generalized it that way, see domain-entities.md).
export interface PlacedItemView extends PlacedHouseItem {
  emoji: string
}

interface BedroomCanvasProps {
  placedItems: PlacedItemView[]
  selectedItemId: string | null
  onReposition: (placedId: string, x: number, y: number) => void
  onSelect: (placedId: string | null) => void
  onRemove: (placedId: string) => void
}

interface PlacedItemTileProps {
  placed: PlacedItemView
  isSelected: boolean
  onDragEnd: (placedId: string, info: PanInfo) => void
  onSelect: (placedId: string | null) => void
  onRemove: (placedId: string) => void
}

// Subcomponent owns controlled MotionValues for x/y and resets them synchronously
// (useLayoutEffect) whenever placed.x/y changes. Without this, Framer Motion accumulates
// the pixel offset from each drag in its internal state, so the next drag starts from the
// wrong visual origin and the item jumps to a wrong position (MH-6).
function PlacedItemTile({ placed, isSelected, onDragEnd, onSelect, onRemove }: PlacedItemTileProps) {
  const motionX = useMotionValue(0)
  const motionY = useMotionValue(0)

  useLayoutEffect(() => {
    motionX.set(0)
    motionY.set(0)
  }, [placed.x, placed.y, motionX, motionY])

  return (
    <motion.div
      className={`absolute cursor-grab active:cursor-grabbing touch-none ${isSelected ? "z-50" : "z-10"}`}
      style={{
        left: `${placed.x}%`,
        top: `${placed.y}%`,
        transform: "translate(-50%, -50%)",
        x: motionX,
        y: motionY,
      }}
      drag
      dragMomentum={false}
      dragElastic={0}
      whileDrag={{ scale: 1.1, zIndex: 100 }}
      onDragEnd={(_, info) => onDragEnd(placed.id, info)}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(isSelected ? null : placed.id)
      }}
      data-testid={`placed-house-${placed.itemId}`}
    >
      <div
        className={`relative transition-all duration-200 ${isSelected ? "ring-4 ring-primary ring-offset-2 rounded-xl" : ""}`}
      >
        <span
          className="drop-shadow-lg select-none block"
          style={{ fontSize: `${3 * placed.scale}rem` }}
        >
          {placed.emoji}
        </span>

        {/* BR-3: remove control only — no resize control in V1. */}
        {isSelected && (
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card rounded-full shadow-xl p-1 border-2 border-border">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(placed.id)
              }}
              className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
              data-testid={`remove-house-${placed.itemId}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Analog of creative-room.tsx's canvas area, generalized to "room". The canvasRef is
// forwarded from MyHouse (the orchestrator) so the same DOM node's bounding rect can
// be read both here (reposition-drag clamp math) and in MyHouse (checking whether a
// MyItemsStrip drop landed inside the canvas, BR-5) without duplicating the ref.
export const BedroomCanvas = forwardRef<HTMLDivElement, BedroomCanvasProps>(function BedroomCanvas(
  { placedItems, selectedItemId, onReposition, onSelect, onRemove },
  canvasRef,
) {
  const handlePlacedItemDragEnd = (placedId: string, info: PanInfo) => {
    const canvasEl = canvasRef && "current" in canvasRef ? canvasRef.current : null
    if (!canvasEl) return
    const placed = placedItems.find((p) => p.id === placedId)
    if (!placed) return

    const canvasRect = canvasEl.getBoundingClientRect()
    const { x, y } = computeRepositionPosition(placed.x, placed.y, info.offset.x, info.offset.y, canvasRect)
    onReposition(placedId, x, y)
  }

  return (
    <div
      ref={canvasRef}
      className="relative bg-gradient-to-br from-card to-secondary rounded-3xl shadow-2xl border-4 border-primary/20 aspect-square max-h-[500px] overflow-hidden"
      data-testid="bedroom-canvas"
      onClick={() => onSelect(null)}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* BR-2: every placedItems entry renders as-is — no ownership cross-check. */}
      {placedItems.map((placed) => (
        <PlacedItemTile
          key={placed.id}
          placed={placed}
          isSelected={selectedItemId === placed.id}
          onDragEnd={handlePlacedItemDragEnd}
          onSelect={onSelect}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
})
