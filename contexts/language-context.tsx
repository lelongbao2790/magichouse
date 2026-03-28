"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { translations, type Language } from "@/data/translations"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (section: keyof typeof translations, key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = "kids-app-language"

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("vi")
  const [isLoaded, setIsLoaded] = useState(false)

  // Load language from localStorage on mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (storedLanguage === "en" || storedLanguage === "vi") {
      setLanguageState(storedLanguage)
    }
    setIsLoaded(true)
  }, [])

  // Save language to localStorage when changed
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  }

  // Translation function
  const t = (section: keyof typeof translations, key: string): string => {
    const sectionData = translations[section]
    if (!sectionData) return key
    
    const entry = sectionData[key as keyof typeof sectionData]
    if (!entry) return key
    
    return (entry as Record<Language, string>)[language] || key
  }

  // Prevent hydration mismatch by not rendering until loaded
  if (!isLoaded) {
    return null
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
