"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Rocket, Star, Heart, Sparkles } from "lucide-react"

interface WelcomeFormProps {
  onStart: (name: string) => void
}

export function WelcomeForm({ onStart }: WelcomeFormProps) {
  const { t } = useLanguage()
  const [name, setName] = useState("")
  const [isHovered, setIsHovered] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onStart(name.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-8 w-full max-w-md" data-testid="welcome-form">
      {/* Input container */}
      <div className="relative w-full">
        {/* Decorative stars */}
        <Star className="absolute -top-4 -left-4 w-6 h-6 text-accent animate-float fill-accent" />
        <Star className="absolute -top-2 -right-6 w-5 h-5 text-highlight animate-float fill-highlight" style={{ animationDelay: "0.5s" }} />
        
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("welcome", "inputPlaceholder")}
            className="w-full px-8 py-5 text-xl font-semibold text-center bg-card text-card-foreground placeholder:text-muted-foreground border-4 border-primary/30 rounded-3xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 shadow-lg"
            data-testid="name-input"
          />
          <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/50" />
          <Heart className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/50" />
        </div>
      </div>

      {/* Submit button with bounce effect */}
      <button
        type="submit"
        disabled={!name.trim()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative flex items-center justify-center gap-4 px-12 py-6 text-2xl font-bold bg-primary text-primary-foreground rounded-full shadow-2xl transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:shadow-3xl hover:scale-105 ${name.trim() ? "animate-bounce-fun" : ""}`}
        style={{
          animationPlayState: isHovered || !name.trim() ? "paused" : "running"
        }}
        data-testid="start-button"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-primary opacity-50 blur-xl transition-all duration-300 group-hover:opacity-70" />
        
        {/* Button content */}
        <span className="relative z-10 flex items-center gap-3">
          <Rocket className={`w-8 h-8 transition-transform duration-300 ${isHovered ? "rotate-12 scale-110" : ""}`} />
          <span>{t("common", "start")}</span>
          <Sparkles className={`w-6 h-6 ${isHovered ? "animate-spin" : ""}`} />
        </span>

        {/* Decorative particles */}
        {name.trim() && (
          <>
            <span className="absolute -top-2 left-1/4 w-2 h-2 bg-accent rounded-full animate-ping" />
            <span className="absolute -bottom-1 right-1/3 w-3 h-3 bg-secondary rounded-full animate-ping" style={{ animationDelay: "0.2s" }} />
            <span className="absolute top-1/2 -right-2 w-2 h-2 bg-highlight rounded-full animate-ping" style={{ animationDelay: "0.4s" }} />
          </>
        )}
      </button>
    </form>
  )
}
