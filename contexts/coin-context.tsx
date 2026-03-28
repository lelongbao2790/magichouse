"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface StickerItem {
  id: string
  name: string
  category: "hat" | "glasses" | "bow" | "toy"
  emoji: string
  price: number
}

interface CoinContextType {
  coins: number
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  childName: string
  setChildName: (name: string) => void
  ownedStickers: string[]
  buySticker: (sticker: StickerItem) => boolean
  hasSticker: (stickerId: string) => boolean
}

const CoinContext = createContext<CoinContextType | undefined>(undefined)

export function CoinProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState<number>(0)
  const [childName, setChildName] = useState<string>("")
  const [ownedStickers, setOwnedStickers] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const savedCoins = localStorage.getItem("kidCoins")
    const savedName = localStorage.getItem("kidName")
    const savedStickers = localStorage.getItem("kidStickers")
    if (savedCoins) {
      setCoins(parseInt(savedCoins, 10))
    }
    if (savedName) {
      setChildName(savedName)
    }
    if (savedStickers) {
      setOwnedStickers(JSON.parse(savedStickers))
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage when coins change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("kidCoins", coins.toString())
    }
  }, [coins, isLoaded])

  // Save stickers to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("kidStickers", JSON.stringify(ownedStickers))
    }
  }, [ownedStickers, isLoaded])

  // Save name to localStorage
  useEffect(() => {
    if (isLoaded && childName) {
      localStorage.setItem("kidName", childName)
    }
  }, [childName, isLoaded])

  const addCoins = (amount: number) => {
    setCoins((prev) => prev + amount)
  }

  const spendCoins = (amount: number) => {
    if (coins >= amount) {
      setCoins((prev) => prev - amount)
      return true
    }
    return false
  }

  const hasSticker = (stickerId: string) => {
    return ownedStickers.includes(stickerId)
  }

  const buySticker = (sticker: StickerItem) => {
    if (coins >= sticker.price && !hasSticker(sticker.id)) {
      setCoins((prev) => prev - sticker.price)
      setOwnedStickers((prev) => [...prev, sticker.id])
      return true
    }
    return false
  }

  return (
    <CoinContext.Provider value={{ 
      coins, 
      addCoins, 
      spendCoins, 
      childName, 
      setChildName, 
      ownedStickers, 
      buySticker, 
      hasSticker 
    }}>
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
