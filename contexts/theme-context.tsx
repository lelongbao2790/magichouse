"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type ThemeType = "forest" | "pink" | "ocean"

interface ThemeContextType {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
  themeName: string
}

const themeNames: Record<ThemeType, string> = {
  forest: "Rừng Xanh",
  pink: "Kẹo Hồng",
  ocean: "Đại Dương",
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>("forest")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("kids-theme") as ThemeType
    if (savedTheme && ["forest", "pink", "ocean"].includes(savedTheme)) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    root.classList.remove("theme-pink", "theme-ocean")
    
    if (theme === "pink") {
      root.classList.add("theme-pink")
    } else if (theme === "ocean") {
      root.classList.add("theme-ocean")
    }
    
    localStorage.setItem("kids-theme", theme)
  }, [theme, mounted])

  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeName: themeNames[theme] }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
