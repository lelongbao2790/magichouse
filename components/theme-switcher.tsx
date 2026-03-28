"use client"

import { useTheme, type ThemeType } from "@/contexts/theme-context"
import { useLanguage } from "@/contexts/language-context"
import { TreePine, Candy, Waves, Sparkles } from "lucide-react"

interface ThemeSwitcherProps {
  compact?: boolean
}

export function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()

  const themes: { id: ThemeType; name: string; icon: typeof TreePine; colors: string[] }[] = [
    {
      id: "forest",
      name: t("themes", "greenForest"),
      icon: TreePine,
      colors: ["bg-green-400", "bg-green-500", "bg-yellow-400"],
    },
    {
      id: "pink",
      name: t("themes", "pinkCandy"),
      icon: Candy,
      colors: ["bg-pink-400", "bg-pink-500", "bg-purple-400"],
    },
    {
      id: "ocean",
      name: t("themes", "ocean"),
      icon: Waves,
      colors: ["bg-blue-400", "bg-cyan-500", "bg-teal-400"],
    },
  ]

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {themes.map((t) => {
          const Icon = t.icon
          const isActive = theme === t.id
          
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`
                relative p-2 rounded-xl transition-all duration-200
                ${isActive 
                  ? "bg-primary text-primary-foreground shadow-lg scale-110" 
                  : "bg-muted text-muted-foreground hover:bg-secondary hover:scale-105"
                }
              `}
              title={t.name}
            >
              <Icon className="w-5 h-5" />
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-foreground/80">
        <Sparkles className="w-5 h-5 text-highlight animate-pulse" />
        <span className="text-lg font-semibold">{t("welcome", "chooseTheme")}</span>
        <Sparkles className="w-5 h-5 text-highlight animate-pulse" />
      </div>
      
      <div className="flex flex-wrap justify-center gap-4">
        {themes.map((t) => {
          const Icon = t.icon
          const isActive = theme === t.id
          
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`
                group relative flex flex-col items-center gap-3 p-5 rounded-3xl
                transition-all duration-300 ease-out
                ${isActive 
                  ? "bg-primary text-primary-foreground scale-105 shadow-xl" 
                  : "bg-card text-card-foreground hover:bg-secondary hover:scale-102 shadow-lg hover:shadow-xl"
                }
              `}
            >
              {/* Decorative ring */}
              {isActive && (
                <div className="absolute inset-0 rounded-3xl animate-pulse-glow opacity-50" />
              )}
              
              {/* Icon */}
              <div className={`
                relative z-10 p-3 rounded-2xl transition-all duration-300
                ${isActive ? "bg-primary-foreground/20" : "bg-muted group-hover:bg-accent"}
              `}>
                <Icon className={`w-8 h-8 ${isActive ? "" : "group-hover:animate-wiggle"}`} />
              </div>
              
              {/* Theme name */}
              <span className="relative z-10 text-base font-bold">{t.name}</span>
              
              {/* Color dots */}
              <div className="relative z-10 flex gap-1.5">
                {t.colors.map((color, index) => (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full ${color} shadow-sm transition-transform duration-200 
                      ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  />
                ))}
              </div>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <span className="text-sm">OK</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
