"use client"

import { useState, useEffect } from "react"
import { ThemeProvider } from "@/contexts/theme-context"
import { CoinProvider } from "@/contexts/coin-context"
import { LanguageProvider, useLanguage } from "@/contexts/language-context"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { LanguageSwitcher } from "@/components/language-switcher"
import { WelcomeScreen } from "@/components/welcome-screen"
import { Dashboard } from "@/components/dashboard"
import { FloatingElements } from "@/components/floating-elements"
import { Code2, Sparkles } from "lucide-react"

function HomeContent() {
  const { t, language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const [showDashboard, setShowDashboard] = useState(false)

  useEffect(() => {
    if (isAuthenticated) setShowDashboard(true)
    else setShowDashboard(false)
  }, [isAuthenticated])

  if (showDashboard && isAuthenticated) {
    return <Dashboard onBack={() => setShowDashboard(false)} />
  }

  const subtitleText = language === "vi"
    ? "Hoc lap trinh that vui va de dang!"
    : "Learning to code is fun and easy!"
  const footerText = language === "vi"
    ? { prefix: "Duoc tao voi", love: "tinh yeu", suffix: "cho cac be yeu lap trinh" }
    : { prefix: "Made with", love: "love", suffix: "for kids who love coding" }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden transition-colors duration-500" data-testid="home-page">
      {/* Floating decorative elements */}
      <FloatingElements />

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-4xl">
        {/* Header */}
        <header className="flex flex-col items-center gap-4 text-center">
          {/* Logo */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl" />
            <div className="relative flex items-center justify-center w-24 h-24 bg-primary rounded-3xl shadow-2xl rotate-6 transition-transform hover:rotate-0 duration-300">
              <Code2 className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <div className="relative">
            <h1 className="text-5xl md:text-6xl font-black text-foreground tracking-tight" data-testid="app-title">
              <span className="inline-flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-accent animate-pulse" />
                <span className="bg-gradient-to-r from-primary via-highlight to-accent bg-clip-text text-transparent">
                  Magic House
                </span>
                <Sparkles className="w-8 h-8 text-accent animate-pulse" />
              </span>
            </h1>
            <p className="mt-3 text-xl md:text-2xl text-muted-foreground font-medium" data-testid="app-subtitle">
              {subtitleText}
            </p>
          </div>
        </header>

        {/* Main card */}
        <div className="w-full bg-card/80 backdrop-blur-sm rounded-[2.5rem] shadow-2xl border-4 border-primary/10 p-8 md:p-12" data-testid="main-card">
          <div className="flex flex-col items-center gap-10">
            {/* Language switcher */}
            <LanguageSwitcher />

            {/* Theme switcher */}
            <ThemeSwitcher />

            {/* Divider */}
            <div className="w-full max-w-xs h-1 bg-gradient-to-r from-transparent via-border to-transparent rounded-full" />

            {/* Welcome screen (auth forms) */}
            <WelcomeScreen />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground" data-testid="footer">
          <p className="flex items-center justify-center gap-2">
            {footerText.prefix}
            <span className="inline-block text-primary animate-pulse">{footerText.love}</span>
            {footerText.suffix}
          </p>
        </footer>
      </div>

      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" style={{ pointerEvents: 'none' }} />
    </main>
  )
}

export default function Home() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CoinProvider>
            <HomeContent />
          </CoinProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
