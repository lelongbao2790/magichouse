"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import type { StickerRow } from "@/lib/database.types"

interface CoinContextType {
  coins: number
  addCoins: (amount: number) => void
  ownedStickers: string[]
  buySticker: (sticker: StickerRow) => Promise<boolean>
  hasSticker: (stickerId: string) => boolean
  isLoaded: boolean
  isCacheFallback: boolean
}

const CoinContext = createContext<CoinContextType | undefined>(undefined)

export function CoinProvider({ children }: { children: ReactNode }) {
  const { player } = useAuth()
  const [coins, setCoins] = useState<number>(0)
  const [ownedStickers, setOwnedStickers] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isCacheFallback, setIsCacheFallback] = useState(false)

  useEffect(() => {
    if (player === null) {
      setCoins(0)
      setOwnedStickers([])
      setIsLoaded(false)
      setIsCacheFallback(false)
      return
    }

    const preMigrationCoins = parseInt(localStorage.getItem("kidCoins") ?? "0")
    const preMigrationStickers: string[] = JSON.parse(localStorage.getItem("kidStickers") ?? "[]")

    const init = async () => {
      try {
        const [meRes, stickersRes] = await Promise.all([
          fetch('/api/players/me'),
          fetch('/api/players/stickers'),
        ])
        const { data: meData } = await meRes.json()
        const { data: stickersData } = await stickersRes.json()

        setCoins(meData.coins)
        setOwnedStickers(stickersData)
        localStorage.setItem("kidCoins", meData.coins.toString())
        localStorage.setItem("kidStickers", JSON.stringify(stickersData))
        setIsLoaded(true)

        checkMigration(preMigrationCoins, preMigrationStickers)
      } catch {
        setCoins(preMigrationCoins)
        setOwnedStickers(preMigrationStickers)
        setIsCacheFallback(true)
        setIsLoaded(true)
      }
    }

    init()
  }, [player])

  const checkMigration = (savedCoins: number, savedStickers: string[]) => {
    if (localStorage.getItem("migrationDone") === "true") return
    if (savedCoins === 0 && savedStickers.length === 0) return

    fetch('/api/players/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coins: savedCoins, ownedStickers: savedStickers }),
    })
      .then(r => r.json())
      .then(({ error }) => { if (!error) localStorage.setItem("migrationDone", "true") })
      .catch(() => {})
  }

  const addCoins = (amount: number) => {
    const newCoins = coins + amount
    setCoins(newCoins)
    localStorage.setItem("kidCoins", newCoins.toString())

    fetch('/api/players/coins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
      .then(r => r.json())
      .then(({ data }) => { if (data) setCoins(data.coins) })
      .catch(() => {})
  }

  const hasSticker = (stickerId: string) => ownedStickers.includes(stickerId)

  const buySticker = async (sticker: StickerRow): Promise<boolean> => {
    try {
      const res = await fetch('/api/players/stickers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stickerId: sticker.id }),
      })
      const { data, error } = await res.json()

      if (error || !data) return false

      const newStickers = [...ownedStickers, sticker.id]
      setCoins(data.newCoinBalance)
      setOwnedStickers(newStickers)
      localStorage.setItem("kidCoins", data.newCoinBalance.toString())
      localStorage.setItem("kidStickers", JSON.stringify(newStickers))
      return true
    } catch {
      return false
    }
  }

  return (
    <CoinContext.Provider value={{ coins, addCoins, ownedStickers, buySticker, hasSticker, isLoaded, isCacheFallback }}>
      {children}
    </CoinContext.Provider>
  )
}

export function useCoins() {
  const context = useContext(CoinContext)
  if (context === undefined) {
    throw new Error("useCoins must be used within a CoinProvider")
  }
  return context
}
