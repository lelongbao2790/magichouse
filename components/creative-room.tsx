"use client"

import { useState, useRef } from "react"
import { motion, PanInfo } from "framer-motion"
import { useCoins } from "@/contexts/coin-context"
import { useLanguage } from "@/contexts/language-context"
import { CoinDisplay } from "./coin-display"
import { ThemeSwitcher } from "./theme-switcher"
import { LanguageSwitcher } from "./language-switcher"
import { allStickers, getStickerById } from "@/data/stickers"
import { ChevronLeft, Palette, Trash2, RotateCcw, Sparkles, ShoppingBag, Plus, Minus } from "lucide-react"
import { translations, type Language } from "@/data/translations"

interface PlacedSticker {
  id: string
  stickerId: string
  x: number
  y: number
  scale: number
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
    image: "/avatars/boy.svg" 
  })
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([])
  const [draggingSticker, setDraggingSticker] = useState<string | null>(null)
  const [selectedPlacedSticker, setSelectedPlacedSticker] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Better looking avatar characters with SVG illustrations
  const characters = [
    { id: "boy", image: "/avatars/boy.svg", emoji: "👦" },
    { id: "girl", image: "/avatars/girl.svg", emoji: "👧" },
    { id: "panda", image: "/avatars/panda.svg", emoji: "🐼" },
    { id: "fox", image: "/avatars/fox.svg", emoji: "🦊" },
    { id: "unicorn", image: "/avatars/unicorn.svg", emoji: "🦄" },
    { id: "bunny", image: "/avatars/bunny.svg", emoji: "🐰" },
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

      const newSticker: PlacedSticker = {
        id: `${stickerId}-${Date.now()}`,
        stickerId,
        x,
        y,
        scale: 1,
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

  // Generate character SVG inline (since we don't have actual image files)
  const getCharacterSVG = (id: string) => {
    const svgStyles: Record<string, { bg: string; accent: string; feature: string }> = {
      boy: { bg: "#FFE4C4", accent: "#8B4513", feature: "#000" },
      girl: { bg: "#FFE4C4", accent: "#FF69B4", feature: "#000" },
      panda: { bg: "#FFFFFF", accent: "#000000", feature: "#000" },
      fox: { bg: "#FF6B35", accent: "#FFFFFF", feature: "#000" },
      unicorn: { bg: "#E6E6FA", accent: "#FF69B4", feature: "#9370DB" },
      bunny: { bg: "#FFE4E1", accent: "#FFC0CB", feature: "#000" },
    }
    
    const style = svgStyles[id] || svgStyles.boy
    
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
        {/* Face background */}
        <ellipse cx="100" cy="110" rx="70" ry="80" fill={style.bg} />
        
        {id === "boy" && (
          <>
            {/* Hair */}
            <ellipse cx="100" cy="60" rx="55" ry="35" fill={style.accent} />
            <rect x="55" y="45" width="90" height="30" rx="5" fill={style.accent} />
            {/* Eyes */}
            <circle cx="75" cy="105" r="10" fill="#FFF" />
            <circle cx="125" cy="105" r="10" fill="#FFF" />
            <circle cx="77" cy="107" r="5" fill={style.feature} />
            <circle cx="127" cy="107" r="5" fill={style.feature} />
            {/* Smile */}
            <path d="M 75 140 Q 100 165 125 140" stroke={style.feature} strokeWidth="4" fill="none" />
            {/* Cheeks */}
            <circle cx="55" cy="125" r="10" fill="#FFB6C1" opacity="0.5" />
            <circle cx="145" cy="125" r="10" fill="#FFB6C1" opacity="0.5" />
          </>
        )}
        
        {id === "girl" && (
          <>
            {/* Hair */}
            <ellipse cx="100" cy="55" rx="65" ry="40" fill={style.accent} />
            <ellipse cx="45" cy="100" rx="20" ry="50" fill={style.accent} />
            <ellipse cx="155" cy="100" rx="20" ry="50" fill={style.accent} />
            {/* Bow */}
            <path d="M 85 30 Q 100 45 115 30 Q 100 20 85 30" fill="#FF1493" />
            <circle cx="100" cy="35" r="8" fill="#FF1493" />
            {/* Eyes */}
            <ellipse cx="75" cy="105" rx="12" ry="15" fill="#FFF" />
            <ellipse cx="125" cy="105" rx="12" ry="15" fill="#FFF" />
            <circle cx="77" cy="108" r="6" fill={style.feature} />
            <circle cx="127" cy="108" r="6" fill={style.feature} />
            {/* Eyelashes */}
            <path d="M 65 95 L 60 90" stroke={style.feature} strokeWidth="2" />
            <path d="M 75 92 L 75 85" stroke={style.feature} strokeWidth="2" />
            <path d="M 125 92 L 125 85" stroke={style.feature} strokeWidth="2" />
            <path d="M 135 95 L 140 90" stroke={style.feature} strokeWidth="2" />
            {/* Smile */}
            <path d="M 80 145 Q 100 165 120 145" stroke={style.feature} strokeWidth="3" fill="none" />
            {/* Cheeks */}
            <circle cx="55" cy="130" r="12" fill="#FFB6C1" opacity="0.6" />
            <circle cx="145" cy="130" r="12" fill="#FFB6C1" opacity="0.6" />
          </>
        )}
        
        {id === "panda" && (
          <>
            {/* Ears */}
            <circle cx="45" cy="50" r="25" fill={style.accent} />
            <circle cx="155" cy="50" r="25" fill={style.accent} />
            {/* Eye patches */}
            <ellipse cx="70" cy="100" rx="25" ry="30" fill={style.accent} />
            <ellipse cx="130" cy="100" rx="25" ry="30" fill={style.accent} />
            {/* Eyes */}
            <circle cx="70" cy="100" r="12" fill="#FFF" />
            <circle cx="130" cy="100" r="12" fill="#FFF" />
            <circle cx="72" cy="102" r="6" fill={style.feature} />
            <circle cx="132" cy="102" r="6" fill={style.feature} />
            {/* Nose */}
            <ellipse cx="100" cy="135" rx="12" ry="8" fill={style.accent} />
            {/* Mouth */}
            <path d="M 85 150 Q 100 165 115 150" stroke={style.feature} strokeWidth="3" fill="none" />
          </>
        )}
        
        {id === "fox" && (
          <>
            {/* Ears */}
            <path d="M 40 80 L 55 20 L 80 70 Z" fill={style.bg} />
            <path d="M 160 80 L 145 20 L 120 70 Z" fill={style.bg} />
            <path d="M 50 70 L 60 35 L 75 65 Z" fill={style.accent} />
            <path d="M 150 70 L 140 35 L 125 65 Z" fill={style.accent} />
            {/* Face mask */}
            <ellipse cx="100" cy="145" rx="35" ry="25" fill={style.accent} />
            {/* Eyes */}
            <ellipse cx="70" cy="105" rx="12" ry="15" fill="#FFF" />
            <ellipse cx="130" cy="105" rx="12" ry="15" fill="#FFF" />
            <ellipse cx="73" cy="108" rx="5" ry="7" fill={style.feature} />
            <ellipse cx="133" cy="108" rx="5" ry="7" fill={style.feature} />
            {/* Nose */}
            <ellipse cx="100" cy="140" rx="10" ry="7" fill={style.feature} />
            {/* Whiskers */}
            <line x1="55" y1="135" x2="25" y2="130" stroke={style.feature} strokeWidth="2" />
            <line x1="55" y1="145" x2="25" y2="150" stroke={style.feature} strokeWidth="2" />
            <line x1="145" y1="135" x2="175" y2="130" stroke={style.feature} strokeWidth="2" />
            <line x1="145" y1="145" x2="175" y2="150" stroke={style.feature} strokeWidth="2" />
          </>
        )}
        
        {id === "unicorn" && (
          <>
            {/* Horn */}
            <path d="M 100 10 L 85 70 L 115 70 Z" fill="#FFD700" />
            {/* Mane */}
            <ellipse cx="45" cy="90" rx="15" ry="40" fill={style.accent} />
            <ellipse cx="35" cy="110" rx="12" ry="35" fill="#FF69B4" />
            <ellipse cx="50" cy="130" rx="10" ry="25" fill="#87CEEB" />
            {/* Ears */}
            <path d="M 55 50 L 45 20 L 70 45 Z" fill={style.bg} />
            <path d="M 145 50 L 155 20 L 130 45 Z" fill={style.bg} />
            {/* Eyes */}
            <ellipse cx="75" cy="105" rx="15" ry="18" fill="#FFF" />
            <ellipse cx="125" cy="105" rx="15" ry="18" fill="#FFF" />
            <circle cx="78" cy="108" r="8" fill={style.feature} />
            <circle cx="128" cy="108" r="8" fill={style.feature} />
            <circle cx="80" cy="104" r="3" fill="#FFF" />
            <circle cx="130" cy="104" r="3" fill="#FFF" />
            {/* Eyelashes */}
            <path d="M 63 92 L 58 85" stroke={style.feature} strokeWidth="2" />
            <path d="M 75 88 L 75 80" stroke={style.feature} strokeWidth="2" />
            <path d="M 125 88 L 125 80" stroke={style.feature} strokeWidth="2" />
            <path d="M 137 92 L 142 85" stroke={style.feature} strokeWidth="2" />
            {/* Nose & mouth */}
            <ellipse cx="100" cy="145" rx="8" ry="5" fill="#FFB6C1" />
            <path d="M 85 160 Q 100 175 115 160" stroke={style.feature} strokeWidth="3" fill="none" />
            {/* Cheeks */}
            <circle cx="55" cy="135" r="10" fill="#FFB6C1" opacity="0.7" />
            <circle cx="145" cy="135" r="10" fill="#FFB6C1" opacity="0.7" />
          </>
        )}
        
        {id === "bunny" && (
          <>
            {/* Ears */}
            <ellipse cx="65" cy="30" rx="20" ry="50" fill={style.bg} />
            <ellipse cx="135" cy="30" rx="20" ry="50" fill={style.bg} />
            <ellipse cx="65" cy="25" rx="10" ry="35" fill={style.accent} />
            <ellipse cx="135" cy="25" rx="10" ry="35" fill={style.accent} />
            {/* Eyes */}
            <ellipse cx="70" cy="100" rx="15" ry="18" fill="#FFF" />
            <ellipse cx="130" cy="100" rx="15" ry="18" fill="#FFF" />
            <circle cx="73" cy="103" r="8" fill={style.feature} />
            <circle cx="133" cy="103" r="8" fill={style.feature} />
            <circle cx="75" cy="100" r="3" fill="#FFF" />
            <circle cx="135" cy="100" r="3" fill="#FFF" />
            {/* Nose */}
            <ellipse cx="100" cy="140" rx="10" ry="8" fill="#FFB6C1" />
            {/* Mouth */}
            <path d="M 100 148 L 100 165" stroke={style.feature} strokeWidth="2" />
            <path d="M 85 160 Q 100 175 115 160" stroke={style.feature} strokeWidth="2" fill="none" />
            {/* Whiskers */}
            <line x1="60" y1="145" x2="30" y2="140" stroke={style.feature} strokeWidth="1.5" />
            <line x1="60" y1="155" x2="30" y2="160" stroke={style.feature} strokeWidth="1.5" />
            <line x1="140" y1="145" x2="170" y2="140" stroke={style.feature} strokeWidth="1.5" />
            <line x1="140" y1="155" x2="170" y2="160" stroke={style.feature} strokeWidth="1.5" />
            {/* Cheeks */}
            <circle cx="50" cy="130" r="12" fill="#FFB6C1" opacity="0.5" />
            <circle cx="150" cy="130" r="12" fill="#FFB6C1" opacity="0.5" />
          </>
        )}
      </svg>
    )
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

              {/* Main character - SVG illustration */}
              <div className="absolute inset-0 flex items-center justify-center p-8" data-testid="main-character">
                <div className="w-48 h-48 md:w-64 md:h-64">
                  {getCharacterSVG(selectedCharacter.id)}
                </div>
              </div>

              {/* Placed stickers */}
              {placedStickers.map((placed) => {
                const sticker = getStickerById(placed.stickerId)
                if (!sticker) return null
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
                        {sticker.emoji}
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
