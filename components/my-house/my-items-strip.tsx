"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/contexts/language-context"
import type { HouseItemCatalogEntry } from "@/lib/services/house-items"

interface MyItemsStripProps {
  items: HouseItemCatalogEntry[]
  onItemDropped: (itemId: string, clientX: number, clientY: number) => void
}

// Analog of Creative Room's "Sticker Collection" panel — draggable chips for owned,
// unplaced items. Bounds-checking the drop (BR-5) is not this component's job: it has
// no reference to the canvas's bounding rect, so it just reports the release client
// coordinates upward regardless of where they landed.
export function MyItemsStrip({ items, onItemDropped }: MyItemsStripProps) {
  const { t } = useLanguage()

  const handleDragEnd = (itemId: string, event: MouseEvent | TouchEvent | PointerEvent) => {
    let clientX: number
    let clientY: number
    if ("changedTouches" in event) {
      const touch = (event as TouchEvent).changedTouches[0]
      clientX = touch.clientX
      clientY = touch.clientY
    } else {
      clientX = (event as MouseEvent).clientX
      clientY = (event as MouseEvent).clientY
    }
    onItemDropped(itemId, clientX, clientY)
  }

  return (
    <div className="bg-card rounded-3xl shadow-xl border-2 border-primary/20 p-5" data-testid="my-items-house">
      <h3 className="text-lg font-bold text-foreground mb-4">{t("house", "myItems")}</h3>

      {items.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {items.map((item) => (
            <motion.div
              key={item.id}
              className="relative cursor-grab active:cursor-grabbing"
              drag
              dragSnapToOrigin
              dragMomentum={false}
              whileDrag={{ scale: 1.3, zIndex: 100 }}
              onDragEnd={(event) => handleDragEnd(item.id, event as unknown as MouseEvent)}
              data-testid={`my-item-${item.id}`}
            >
              <div className="bg-secondary rounded-2xl p-3 flex flex-col items-center gap-1 hover:bg-accent/20 transition-colors touch-none">
                <span className="text-4xl">{item.emoji}</span>
                <span className="text-xs font-medium text-muted-foreground text-center truncate w-full">
                  {item.name}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8" data-testid="no-house-items-message">
          <p className="text-muted-foreground">{t("house", "noItemsToPlace")}</p>
        </div>
      )}
    </div>
  )
}
