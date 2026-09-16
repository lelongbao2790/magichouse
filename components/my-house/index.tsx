"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, Home } from "lucide-react"
import { useCoins } from "@/contexts/coin-context"
import { useLanguage } from "@/contexts/language-context"
import { CoinDisplay } from "../coin-display"
import { ThemeSwitcher } from "../theme-switcher"
import { LanguageSwitcher } from "../language-switcher"
import { useHouseItems } from "@/lib/hooks/use-house-items"
import { useRooms } from "@/lib/hooks/use-rooms"
import type { PlacedHouseItem } from "@/lib/database.types"
import { RoomNav } from "./room-nav"
import { ItemCatalog } from "./item-catalog"
import { MyItemsStrip } from "./my-items-strip"
import { BedroomCanvas, type PlacedItemView } from "./bedroom-canvas"
import { computeDropPosition } from "./layout-math"

interface MyHouseProps {
  onBack: () => void
}

// Orchestrator for the whole My House screen — mirrors StickerShop/CreativeRoom's
// full-screen convention exactly. Owns cross-cutting state (activeRoom, placedItems,
// selectedPlacementId) and fetches/saves the active room's layout; composes RoomNav,
// ItemCatalog, MyItemsStrip, and BedroomCanvas as siblings (component-dependency.md).
export function MyHouse({ onBack }: MyHouseProps) {
  const { ownedHouseItems } = useCoins()
  const { t, language } = useLanguage()

  const [activeRoom, setActiveRoom] = useState<string>("bedroom")
  const [placedItems, setPlacedItems] = useState<PlacedHouseItem[]>([])
  // Gates the autosave effect (BR-7) — mirrors creative-room.tsx's canvasLoaded,
  // preventing a save-of-empty-array race before the real layout has loaded.
  const [layoutLoaded, setLayoutLoaded] = useState(false)
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)

  const { rooms } = useRooms(language) // BR-1: [] on failure, no hardcoded fallback
  const { catalog } = useHouseItems(activeRoom, language)

  // Load the active room's layout on mount and whenever the active room changes.
  useEffect(() => {
    let cancelled = false
    setLayoutLoaded(false)

    fetch(`/api/players/house-layout?room=${encodeURIComponent(activeRoom)}`)
      .then((res) => res.json())
      .then(({ data }: { data: PlacedHouseItem[] | null }) => {
        if (cancelled) return
        setPlacedItems(data ?? [])
        setLayoutLoaded(true)
      })
      .catch(() => {
        if (cancelled) return
        setPlacedItems([])
        setLayoutLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [activeRoom])

  // BR-7: debounced (300ms), last-write-wins autosave — matches creative-room.tsx's
  // single useEffect keyed on placedStickers exactly. Only fires once the layout has
  // actually loaded, avoiding a save-of-empty-array race on first mount/room switch.
  useEffect(() => {
    if (!layoutLoaded) return
    const timer = setTimeout(() => {
      fetch("/api/players/house-layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: activeRoom, layoutData: placedItems }),
      }).catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [placedItems, layoutLoaded, activeRoom])

  const handleSelectRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId)
    if (!room || room.locked) return // defensive — RoomNav already guards (BR-6)
    setActiveRoom(roomId)
  }

  const handlePlaceItem = (itemId: string, x: number, y: number) => {
    setPlacedItems((prev) => [
      ...prev,
      { id: `placed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, itemId, x, y, scale: 1, rotation: 0 },
    ])
  }

  // Bridges MyItemsStrip's drag-end (a global clientX/clientY) to a placement: checks
  // whether the drop landed inside the Bedroom canvas and clamps the position (BR-5,
  // Workflow 3) before ever calling handlePlaceItem.
  const handleItemDropped = (itemId: string, clientX: number, clientY: number) => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const position = computeDropPosition(clientX, clientY, canvasEl.getBoundingClientRect())
    if (!position) return // drop landed outside the canvas — no-op (BR-5)
    handlePlaceItem(itemId, position.x, position.y)
  }

  const handleRepositionItem = (placedId: string, x: number, y: number) => {
    setPlacedItems((prev) => prev.map((p) => (p.id === placedId ? { ...p, x, y } : p)))
  }

  const handleRemoveItem = (placedId: string) => {
    setPlacedItems((prev) => prev.filter((p) => p.id !== placedId))
    setSelectedPlacementId((prev) => (prev === placedId ? null : prev))
  }

  const handleSelectPlacedItem = (placedId: string | null) => {
    setSelectedPlacementId(placedId)
  }

  // Derived: owned-but-not-yet-placed items (Q2=A — no server cross-check, just a
  // client-side set difference against whatever placedItems/ownedHouseItems hold).
  const placedItemIds = new Set(placedItems.map((p) => p.itemId))
  const unplacedOwnedItems = catalog.filter(
    (item) => ownedHouseItems.includes(item.id) && !placedItemIds.has(item.id),
  )

  // PlacedHouseItem carries only itemId (not emoji) — resolve it against the active
  // room's catalog for display, mirroring creative-room.tsx's PlacedSticker.emoji.
  const catalogById = new Map(catalog.map((item) => [item.id, item]))
  const placedItemsWithEmoji: PlacedItemView[] = placedItems.map((p) => ({
    ...p,
    emoji: catalogById.get(p.itemId)?.emoji ?? "❓",
  }))

  return (
    <div className="min-h-screen bg-background" data-testid="my-house">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b-2 border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full hover:bg-secondary transition-colors"
                data-testid="house-back"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium text-sm hidden sm:inline">{t("common", "back")}</span>
              </button>
              <div className="flex items-center gap-2">
                <Home className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold text-foreground">{t("house", "title")}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CoinDisplay />
              <LanguageSwitcher compact />
              <div className="hidden md:block">
                <ThemeSwitcher compact />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <RoomNav rooms={rooms} activeRoom={activeRoom} onSelectRoom={handleSelectRoom} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <BedroomCanvas
              ref={canvasRef}
              placedItems={placedItemsWithEmoji}
              selectedItemId={selectedPlacementId}
              onReposition={handleRepositionItem}
              onSelect={handleSelectPlacedItem}
              onRemove={handleRemoveItem}
            />
            <MyItemsStrip items={unplacedOwnedItems} onItemDropped={handleItemDropped} />
          </div>

          <div className="lg:col-span-1">
            <ItemCatalog room={activeRoom} />
          </div>
        </div>
      </main>
    </div>
  )
}
