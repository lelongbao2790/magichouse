"use client"

import { useLanguage } from "@/contexts/language-context"
import { Languages } from "lucide-react"

interface LanguageSwitcherProps {
  compact?: boolean
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()

  const languages = [
    { id: "vi" as const, label: "VI", fullName: "Tieng Viet", flag: "VN" },
    { id: "en" as const, label: "EN", fullName: "English", flag: "US" },
  ]

  if (compact) {
    return (
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1" data-testid="language-switcher">
        {languages.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200
              ${language === lang.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-secondary"
              }
            `}
            data-testid={`lang-${lang.id}`}
            aria-label={lang.fullName}
          >
            {lang.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3" data-testid="language-switcher">
      <div className="flex items-center gap-2 text-foreground/80">
        <Languages className="w-5 h-5 text-highlight" />
        <span className="text-base font-semibold">
          {language === "vi" ? "Chon ngon ngu" : "Choose Language"}
        </span>
      </div>
      <div className="flex gap-3">
        {languages.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            className={`
              flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all duration-200
              ${language === lang.id
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "bg-card text-card-foreground hover:bg-secondary shadow-md hover:scale-102"
              }
            `}
            data-testid={`lang-${lang.id}`}
            aria-label={lang.fullName}
          >
            <span className="text-lg">{lang.flag === "VN" ? "🇻🇳" : "🇺🇸"}</span>
            <span>{lang.fullName}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
