"use client"

import { useState } from "react"
import { Check, Coins, Loader2, Lock } from "lucide-react"
import { useCoins } from "@/contexts/coin-context"
import { useLanguage } from "@/contexts/language-context"
import { useHouseItems } from "@/lib/hooks/use-house-items"
import type { HouseItemCatalogEntry } from "@/lib/services/house-items"

interface ItemCatalogProps {
  room: string
}

// Analog of StickerShop's grid, minus category tabs (no sub-categories per room in V1).
// Per FR-2.1/component-methods.md's Correction: item names are already localized
// server-side (item.name) — no client-side nameMap lookup here.
export function ItemCatalog({ room }: ItemCatalogProps) {
  const { coins, buyHouseItem, hasHouseItem } = useCoins()
  const { t, language } = useLanguage()
  const { catalog, loading } = useHouseItems(room, language)
  // BR-4's double-submit guard — mirrors sticker-shop.tsx's purchasingStickerId.
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null)

  const handleBuy = async (item: HouseItemCatalogEntry) => {
    setBuyingItemId(item.id)
    await buyHouseItem(item)
    setBuyingItemId(null)
  }

  return (
    <div className="bg-card rounded-3xl shadow-xl border-2 border-primary/20 p-5">
      <h3 className="text-lg font-bold text-foreground mb-4">{t("house", "catalogTitle")}</h3>

      {loading && (
        <div className="flex items-center justify-center py-10" data-testid="house-catalog-loading">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" data-testid="house-items-grid">
          {catalog.map((item) => {
            // BR-4: exactly one of three states — Owned / Buyable / Unaffordable.
            const owned = hasHouseItem(item.id)
            const canAfford = coins >= item.price
            const isBuying = buyingItemId === item.id

            return (
              <div
                key={item.id}
                className={`relative bg-card rounded-2xl p-4 shadow-lg border-2 transition-all duration-300 ${
                  owned
                    ? "border-green-400 bg-green-50/50"
                    : canAfford
                      ? "border-primary/20 hover:border-primary hover:scale-105"
                      : "border-border opacity-70"
                }`}
                data-testid={`house-item-${item.id}`}
                data-owned={owned ? "true" : "false"}
              >
                {owned && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className="flex justify-center mb-3">
                  <span className="text-5xl drop-shadow-lg">{item.emoji}</span>
                </div>

                <h4 className="text-center font-bold text-foreground mb-2 text-sm">{item.name}</h4>

                {owned ? (
                  <div className="text-center text-green-600 font-semibold text-sm flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" />
                    {t("house", "owned")}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="font-bold text-foreground">{item.price}</span>
                    </div>

                    <button
                      onClick={() => handleBuy(item)}
                      disabled={isBuying || !canAfford}
                      className={`w-full py-2 rounded-xl font-bold text-sm transition-all duration-200 ${
                        canAfford && !isBuying
                          ? "bg-gradient-to-r from-primary to-highlight text-primary-foreground hover:shadow-lg active:scale-95"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                      data-testid={`buy-house-${item.id}`}
                    >
                      {isBuying ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </span>
                      ) : canAfford ? (
                        t("house", "buyNow")
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <Lock className="w-3 h-3" />
                          {t("house", "needMore")} {item.price - coins} {t("house", "coin")}
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && catalog.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">{t("house", "noItemsInRoom")}</p>
        </div>
      )}
    </div>
  )
}
