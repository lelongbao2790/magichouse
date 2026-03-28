"use client"

import { useState } from "react"
import { useCoins } from "@/contexts/coin-context"
import { useLanguage } from "@/contexts/language-context"
import { CoinDisplay } from "./coin-display"
import { ThemeSwitcher } from "./theme-switcher"
import { LanguageSwitcher } from "./language-switcher"
import { allStickers, getStickersByCategory } from "@/data/stickers"
import { ChevronLeft, ShoppingBag, Check, Coins, Sparkles, Lock } from "lucide-react"

interface StickerShopProps {
  name: string
  onBack: () => void
  onGoToCreative: () => void
}

export function StickerShop({ name, onBack, onGoToCreative }: StickerShopProps) {
  const { coins, buySticker, hasSticker, ownedStickers } = useCoins()
  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState<string>("hat")
  const [purchaseAnimation, setPurchaseAnimation] = useState<string | null>(null)

  const stickerCategories = [
    { id: "hat", name: t("shop", "hats"), icon: "🎩" },
    { id: "glasses", name: t("shop", "glasses"), icon: "👓" },
    { id: "bow", name: t("shop", "bows"), icon: "🎀" },
    { id: "toy", name: t("shop", "toys"), icon: "🧸" },
  ]

  const currentStickers = getStickersByCategory(activeTab)
  const ownedCount = ownedStickers.length
  const totalCount = allStickers.length

  const handleBuy = (sticker: typeof allStickers[0]) => {
    if (buySticker(sticker)) {
      setPurchaseAnimation(sticker.id)
      setTimeout(() => setPurchaseAnimation(null), 1000)
    }
  }

  const getStickerName = (sticker: typeof allStickers[0]) => {
    // Map sticker IDs to translation keys
    const nameMap: Record<string, string> = {
      "cowboy-hat": "cowboyHat",
      "crown": "crown",
      "party-hat": "partyHat",
      "top-hat": "topHat",
      "sunglasses": "sunglasses",
      "glasses": "glasses",
      "star-glasses": "starGlasses",
      "red-bow": "redBow",
      "ribbon": "ribbon",
      "flower": "flower",
      "balloon": "balloon",
      "teddy": "toy",
      "ball": "ball",
      "car": "car",
      "rocket": "rocket",
      "star": "star",
    }
    const key = nameMap[sticker.id]
    return key ? t("stickers", key) : sticker.name
  }

  return (
    <div className="min-h-screen bg-background" data-testid="sticker-shop">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b-2 border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full hover:bg-secondary transition-colors"
                data-testid="shop-back"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium text-sm hidden sm:inline">{t("common", "back")}</span>
              </button>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold text-foreground">{t("shop", "title")}</span>
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
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats & Go to Creative Room */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 bg-card rounded-2xl px-6 py-4 shadow-lg border-2 border-primary/20">
            <Sparkles className="w-6 h-6 text-accent" />
            <span className="text-lg font-semibold text-foreground" data-testid="collection-count">
              {t("shop", "collection")}: <span className="text-primary">{ownedCount}</span> / {totalCount}
            </span>
          </div>
          
          <button
            onClick={onGoToCreative}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-highlight text-primary-foreground font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform"
            data-testid="go-to-creative"
          >
            <span>{t("shop", "goToCreative")}</span>
            <span className="text-xl">🎨</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8" data-testid="shop-tabs">
          {stickerCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-base transition-all duration-200 ${
                activeTab === cat.id
                  ? "bg-primary text-primary-foreground shadow-lg scale-105"
                  : "bg-card text-card-foreground hover:bg-secondary shadow-md"
              }`}
              data-testid={`shop-tab-${cat.id}`}
            >
              <span className="text-xl">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Stickers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" data-testid="stickers-grid">
          {currentStickers.map((sticker) => {
            const owned = hasSticker(sticker.id)
            const canAfford = coins >= sticker.price
            const isPurchasing = purchaseAnimation === sticker.id

            return (
              <div
                key={sticker.id}
                className={`relative bg-card rounded-3xl p-5 shadow-xl border-2 transition-all duration-300 ${
                  owned 
                    ? "border-green-400 bg-green-50/50" 
                    : canAfford 
                      ? "border-primary/20 hover:border-primary hover:scale-105 hover:shadow-2xl" 
                      : "border-border opacity-70"
                } ${isPurchasing ? "animate-bounce" : ""}`}
                data-testid={`sticker-${sticker.id}`}
              >
                {/* Owned badge */}
                {owned && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Sticker emoji */}
                <div className="flex justify-center mb-4">
                  <span className="text-6xl drop-shadow-lg">{sticker.emoji}</span>
                </div>

                {/* Name */}
                <h3 className="text-center font-bold text-foreground mb-3">{getStickerName(sticker)}</h3>

                {/* Price / Status */}
                {owned ? (
                  <div className="text-center text-green-600 font-semibold flex items-center justify-center gap-1" data-testid="sticker-owned">
                    <Check className="w-4 h-4" />
                    {t("shop", "owned")}
                  </div>
                ) : (
                  <>
                    {/* Price */}
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      <span className="font-bold text-lg text-foreground">{sticker.price}</span>
                    </div>

                    {/* Buy button */}
                    <button
                      onClick={() => handleBuy(sticker)}
                      disabled={!canAfford}
                      className={`w-full py-3 rounded-xl font-bold text-base transition-all duration-200 ${
                        canAfford
                          ? "bg-gradient-to-r from-primary to-highlight text-primary-foreground hover:shadow-lg active:scale-95"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                      data-testid={`buy-${sticker.id}`}
                    >
                      {canAfford ? (
                        <span className="flex items-center justify-center gap-2">
                          <ShoppingBag className="w-5 h-5" />
                          {t("shop", "buyNow")}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Lock className="w-4 h-4" />
                          {t("shop", "needMore")} {sticker.price - coins} {t("shop", "coin")}
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {currentStickers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">{t("shop", "noStickers")}</p>
          </div>
        )}
      </main>
    </div>
  )
}
