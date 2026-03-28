"use client"

import { useState } from "react"
import { useCoins } from "@/contexts/coin-context"
import { useLanguage } from "@/contexts/language-context"
import { CoinDisplay } from "./coin-display"
import { ThemeSwitcher } from "./theme-switcher"
import { LanguageSwitcher } from "./language-switcher"
import { QuizModal } from "./quiz-modal"
import { Fireworks } from "./fireworks"
import { StickerShop } from "./sticker-shop"
import { CreativeRoom } from "./creative-room"
import { LearningZone } from "./learning-zone"
import { 
  ChevronLeft, Star, ShoppingBag, Brush, BookOpenCheck, Sparkles
} from "lucide-react"

interface DashboardProps {
  name: string
  onBack: () => void
}

type ViewType = "dashboard" | "shop" | "creative" | "learning"

export function Dashboard({ name, onBack }: DashboardProps) {
  const { addCoins } = useCoins()
  const { t } = useLanguage()
  const [showFireworks, setShowFireworks] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>("dashboard")

  const handleQuizComplete = () => {
    setShowFireworks(true)
    addCoins(10)
  }

  const handleFireworksComplete = () => {
    setShowFireworks(false)
  }

  // Render Shop view
  if (currentView === "shop") {
    return (
      <StickerShop 
        name={name} 
        onBack={() => setCurrentView("dashboard")} 
        onGoToCreative={() => setCurrentView("creative")}
      />
    )
  }

  // Render Creative Room view
  if (currentView === "creative") {
    return (
      <CreativeRoom 
        name={name} 
        onBack={() => setCurrentView("dashboard")} 
        onGoToShop={() => setCurrentView("shop")}
      />
    )
  }

  // Render Learning Zone view
  if (currentView === "learning") {
    return (
      <LearningZone
        name={name}
        onBack={() => setCurrentView("dashboard")}
        onQuizComplete={handleQuizComplete}
        showFireworks={showFireworks}
        onFireworksComplete={handleFireworksComplete}
      />
    )
  }

  // Main sections
  const mainSections = [
    {
      id: "shop",
      name: t("dashboard", "stickerShop"),
      description: t("dashboard", "stickerShopDesc"),
      icon: ShoppingBag,
      gradient: "from-yellow-400 via-orange-400 to-red-400",
      bgDecor: "bg-yellow-100",
      emoji: "🛒",
    },
    {
      id: "creative",
      name: t("dashboard", "creativeRoom"),
      description: t("dashboard", "creativeRoomDesc"),
      icon: Brush,
      gradient: "from-purple-400 via-pink-400 to-rose-400",
      bgDecor: "bg-purple-100",
      emoji: "🎨",
    },
    {
      id: "learning",
      name: t("dashboard", "learningZone"),
      description: t("dashboard", "learningZoneDesc"),
      icon: BookOpenCheck,
      gradient: "from-green-400 via-emerald-400 to-teal-400",
      bgDecor: "bg-green-100",
      emoji: "📚",
    },
  ]

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard">
      {/* Fireworks effect */}
      <Fireworks isActive={showFireworks} onComplete={handleFireworksComplete} />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b-2 border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Back button & Name */}
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full hover:bg-secondary transition-colors"
                data-testid="back-button"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium text-sm hidden sm:inline">{t("common", "back")}</span>
              </button>
              <div className="text-lg font-bold text-foreground" data-testid="user-greeting">
                {t("common", "hello")}, <span className="text-primary">{name}</span>!
              </div>
            </div>

            {/* Coin display, Language & Theme switcher */}
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
        {/* Mobile theme switcher */}
        <div className="md:hidden mb-6">
          <ThemeSwitcher />
        </div>

        {/* Welcome message */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-highlight animate-pulse" />
            <h1 className="text-3xl md:text-4xl font-black text-foreground">
              {t("dashboard", "title")}
            </h1>
            <Sparkles className="w-6 h-6 text-highlight animate-pulse" />
          </div>
          <p className="text-muted-foreground text-lg">
            {t("dashboard", "preschoolDesc")}
          </p>
        </div>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8" data-testid="main-nav">
          {mainSections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setCurrentView(section.id as ViewType)}
                className="group relative bg-card rounded-3xl shadow-2xl border-2 border-primary/10 overflow-hidden hover:border-primary/30 hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] cursor-pointer text-left"
                data-testid={`nav-${section.id}`}
              >
                {/* Gradient header */}
                <div className={`h-32 bg-gradient-to-br ${section.gradient} flex items-center justify-center relative overflow-hidden`}>
                  {/* Decorative circles */}
                  <div className="absolute top-2 left-2 w-16 h-16 bg-white/20 rounded-full blur-xl" />
                  <div className="absolute bottom-2 right-2 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                  
                  {/* Main emoji */}
                  <span className="text-6xl drop-shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    {section.emoji}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-xl ${section.bgDecor}`}>
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{section.name}</h2>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{section.description}</p>
                  
                  {/* Action hint */}
                  <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                    <span>{section.id === "learning" ? t("dashboard", "startLearning") : t("common", "start")}</span>
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
