"use client"

import { useState, useRef, useEffect } from "react"
import { motion, PanInfo } from "framer-motion"
import { useCoins } from "@/contexts/coin-context"
import { useLanguage } from "@/contexts/language-context"
import { CoinDisplay } from "./coin-display"
import { ThemeSwitcher } from "./theme-switcher"
import { LanguageSwitcher } from "./language-switcher"
import { allStickers } from "@/data/stickers"
import { ChevronLeft, Palette, Trash2, RotateCcw, Sparkles, ShoppingBag, Plus, Minus } from "lucide-react"
import { translations, type Language } from "@/data/translations"

interface PlacedSticker {
  id: string
  emoji: string
  x: number
  y: number
  scale: number
  rotation: number
}

interface CreativeRoomProps {
  name: string
  onBack: () => void
  onGoToShop: () => void
}

export function CreativeRoom({ name, onBack, onGoToShop }: CreativeRoomProps) {
  const { ownedStickers } = useCoins()
  const { t, language } = useLanguage()
  const [selectedCharacter, setSelectedCharacter] = useState<{ id: string; image: string }>({
    id: "boy",
    image: "/icon/babybot.png"
  })
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([])
  const [canvasLoaded, setCanvasLoaded] = useState(false)
  const [draggingSticker, setDraggingSticker] = useState<string | null>(null)
  const [selectedPlacedSticker, setSelectedPlacedSticker] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/players/canvas')
      .then(r => r.json())
      .then(({ data }) => { setPlacedStickers(data ?? []); setCanvasLoaded(true) })
      .catch(() => { setCanvasLoaded(true) })
  }, [])

  useEffect(() => {
    if (!canvasLoaded) return
    const timer = setTimeout(() => {
      fetch('/api/players/canvas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasData: placedStickers }),
      }).catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [placedStickers, canvasLoaded])

  const characters = [
    { id: "boy", image: "/icon/babybot.png", emoji: "👦" },
    { id: "girl", image: "/icon/lucy.png", emoji: "👧" },
  ]

  const getCharacterName = (id: string) => {
    const charNames = translations.creative.characters
    const charKey = id as keyof typeof charNames
    if (charNames[charKey]) {
      return charNames[charKey][language as Language]
    }
    return id
  }

  const ownedStickerItems = allStickers.filter((s) => ownedStickers.includes(s.id))

  const handleDragEnd = (stickerId: string, info: PanInfo, event: MouseEvent | TouchEvent | PointerEvent) => {
    if (!canvasRef.current) return

    const canvasRect = canvasRef.current.getBoundingClientRect()
    
    // Get the final position from the event
    let clientX: number, clientY: number
    if ('touches' in event) {
      const touch = event.changedTouches[0]
      clientX = touch.clientX
      clientY = touch.clientY
    } else {
      clientX = (event as MouseEvent).clientX
      clientY = (event as MouseEvent).clientY
    }

    // Check if dropped within canvas
    if (
      clientX >= canvasRect.left &&
      clientX <= canvasRect.right &&
      clientY >= canvasRect.top &&
      clientY <= canvasRect.bottom
    ) {
      const x = ((clientX - canvasRect.left) / canvasRect.width) * 100
      const y = ((clientY - canvasRect.top) / canvasRect.height) * 100

      const stickerItem = ownedStickerItems.find(s => s.id === stickerId)
      if (!stickerItem) return

      const newSticker: PlacedSticker = {
        id: `item-${Date.now()}`,
        emoji: stickerItem.emoji,
        x,
        y,
        scale: 1,
        rotation: 0,
      }
      setPlacedStickers((prev) => [...prev, newSticker])
    }
    
    setDraggingSticker(null)
  }

  const handlePlacedStickerDragEnd = (placedId: string, info: PanInfo) => {
    if (!canvasRef.current) return
    const canvasRect = canvasRef.current.getBoundingClientRect()
    
    setPlacedStickers((prev) =>
      prev.map((s) => {
        if (s.id !== placedId) return s
        
        // Calculate new position based on offset
        const newX = Math.max(5, Math.min(95, s.x + (info.offset.x / canvasRect.width) * 100))
        const newY = Math.max(5, Math.min(95, s.y + (info.offset.y / canvasRect.height) * 100))
        
        return { ...s, x: newX, y: newY }
      })
    )
  }

  const handleRemoveSticker = (id: string) => {
    setPlacedStickers((prev) => prev.filter((s) => s.id !== id))
    if (selectedPlacedSticker === id) {
      setSelectedPlacedSticker(null)
    }
  }

  const handleResizeSticker = (id: string, delta: number) => {
    setPlacedStickers((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const newScale = Math.max(0.5, Math.min(2.5, s.scale + delta))
        return { ...s, scale: newScale }
      })
    )
  }

  const handleClearAll = () => {
    setPlacedStickers([])
    setSelectedPlacedSticker(null)
  }

  const handleStickerClick = (id: string) => {
    setSelectedPlacedSticker(selectedPlacedSticker === id ? null : id)
  }


  return (
    <div className="min-h-screen bg-background" data-testid="creative-room">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b-2 border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full hover:bg-secondary transition-colors"
                data-testid="creative-back"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium text-sm hidden sm:inline">{t("common", "back")}</span>
              </button>
              <div className="flex items-center gap-2">
                <Palette className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold text-foreground">{t("creative", "title")}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas Area */}
          <div className="lg:col-span-2">
            {/* Character selector */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-muted-foreground mb-2">{t("creative", "selectCharacter")}</p>
              <div className="flex flex-wrap gap-2" data-testid="character-selector">
                {characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedCharacter(char)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                      selectedCharacter.id === char.id
                        ? "bg-primary text-primary-foreground shadow-lg scale-105"
                        : "bg-card text-card-foreground hover:bg-secondary shadow-md"
                    }`}
                    data-testid={`char-${char.id}`}
                  >
                    <span className="text-xl">{char.emoji}</span>
                    <span className="hidden sm:inline text-sm">{getCharacterName(char.id)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas */}
            <div
              ref={canvasRef}
              className="relative bg-gradient-to-br from-card to-secondary rounded-3xl shadow-2xl border-4 border-primary/20 aspect-square max-h-[500px] overflow-hidden"
              data-testid="creative-canvas"
              onClick={() => setSelectedPlacedSticker(null)}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full" style={{
                  backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
              </div>

              {/* Main character */}
              <div className="absolute inset-0 flex items-center justify-center p-8" data-testid="main-character">
                <div className="w-48 h-48 md:w-64 md:h-64">
                  <img
                    src={selectedCharacter.image}
                    alt={selectedCharacter.id}
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>
              </div>

              {/* Placed stickers */}
              {placedStickers.map((placed) => {
                const isSelected = selectedPlacedSticker === placed.id

                return (
                  <motion.div
                    key={placed.id}
                    className={`absolute cursor-grab active:cursor-grabbing touch-none ${isSelected ? 'z-50' : 'z-10'}`}
                    style={{
                      left: `${placed.x}%`,
                      top: `${placed.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    whileDrag={{ scale: 1.1, zIndex: 100 }}
                    onDragEnd={(_, info) => handlePlacedStickerDragEnd(placed.id, info)}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStickerClick(placed.id)
                    }}
                    data-testid={`placed-sticker-${placed.id}`}
                  >
                    <div className={`relative transition-all duration-200 ${isSelected ? 'ring-4 ring-primary ring-offset-2 rounded-xl' : ''}`}>
                      <span
                        className="drop-shadow-lg select-none block"
                        style={{ fontSize: `${3 * placed.scale}rem` }}
                      >
                        {placed.emoji}
                      </span>
                      
                      {/* Resize & Delete controls - show when selected */}
                      {isSelected && (
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card rounded-full shadow-xl p-1 border-2 border-border">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleResizeSticker(placed.id, -0.2)
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-muted rounded-full hover:bg-secondary transition-colors"
                            data-testid={`shrink-${placed.id}`}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleResizeSticker(placed.id, 0.2)
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-muted rounded-full hover:bg-secondary transition-colors"
                            data-testid={`grow-${placed.id}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveSticker(placed.id)
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                            data-testid={`delete-${placed.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}

              {/* Drop hint */}
              {draggingSticker && (
                <div className="absolute inset-0 border-4 border-dashed border-primary/50 rounded-3xl pointer-events-none flex items-center justify-center">
                  <span className="text-primary font-bold text-lg bg-card/80 px-4 py-2 rounded-xl">
                    {t("creative", "dropHere")}
                  </span>
                </div>
              )}
            </div>

            {/* Actions & hints */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                {t("creative", "resizeHint")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClearAll}
                  disabled={placedStickers.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="clear-all-button"
                >
                  <RotateCcw className="w-5 h-5" />
                  {t("common", "clearAll")}
                </button>
                <button
                  onClick={onGoToShop}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-highlight text-primary-foreground font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
                  data-testid="buy-more-button"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {t("creative", "buyMore")}
                </button>
              </div>
            </div>
          </div>

          {/* Sticker Collection */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-3xl shadow-xl border-2 border-primary/20 p-5 sticky top-28" data-testid="sticker-collection">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-bold text-foreground">{t("creative", "yourCollection")}</h3>
              </div>

              {ownedStickerItems.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2" data-testid="owned-stickers-grid">
                  {ownedStickerItems.map((sticker) => (
                    <motion.div
                      key={sticker.id}
                      className="relative cursor-grab active:cursor-grabbing"
                      drag
                      dragSnapToOrigin
                      dragMomentum={false}
                      whileDrag={{ scale: 1.3, zIndex: 100 }}
                      onDragStart={() => setDraggingSticker(sticker.id)}
                      onDragEnd={(event, info) => handleDragEnd(sticker.id, info, event as unknown as MouseEvent)}
                      data-testid={`drag-sticker-${sticker.id}`}
                    >
                      <div className="bg-secondary rounded-2xl p-3 flex flex-col items-center gap-1 hover:bg-accent/20 transition-colors touch-none">
                        <span className="text-4xl">{sticker.emoji}</span>
                        <span className="text-xs font-medium text-muted-foreground text-center truncate w-full">
                          {sticker.name}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8" data-testid="no-stickers-message">
                  <p className="text-muted-foreground mb-4">
                    {t("creative", "noStickers")} 
                  </p>
                  <button
                    onClick={onGoToShop}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
                    data-testid="go-to-shop-button"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {t("creative", "goToShop")}
                  </button>
                </div>
              )}

              {/* Instructions */}
              {ownedStickerItems.length > 0 && (
                <div className="mt-4 p-3 bg-accent/10 rounded-xl" data-testid="drag-hint">
                  <p className="text-sm text-muted-foreground text-center">
                    {t("creative", "dragHint")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
