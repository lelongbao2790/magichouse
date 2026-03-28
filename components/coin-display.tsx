"use client"

import { useCoins } from "@/contexts/coin-context"
import { useLanguage } from "@/contexts/language-context"
import { Coins } from "lucide-react"

export function CoinDisplay() {
  const { coins } = useCoins()
  const { t } = useLanguage()

  return (
    <div 
      className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-yellow-400/20 via-amber-300/20 to-yellow-400/20 rounded-full border-2 border-yellow-400/40 shadow-lg backdrop-blur-sm"
      data-testid="coin-display"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-60 animate-pulse" />
        <div className="relative w-10 h-10 bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-xl border-2 border-yellow-200 animate-coin-shine">
          <Coins className="w-5 h-5 text-yellow-800" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-muted-foreground leading-tight">{t("common", "coinCount")}</span>
        <span className="text-2xl font-black text-yellow-600 leading-tight tabular-nums" data-testid="coin-value">
          {coins}
        </span>
      </div>
    </div>
  )
}
