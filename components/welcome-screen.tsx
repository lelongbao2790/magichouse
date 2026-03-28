"use client"

import { useTheme } from "@/contexts/theme-context"
import { useLanguage } from "@/contexts/language-context"
import { Code2, Stars, Smile, PartyPopper, Zap, Gift } from "lucide-react"

interface WelcomeScreenProps {
  name: string
  onReset: () => void
}

export function WelcomeScreen({ name, onReset }: WelcomeScreenProps) {
  const { themeName } = useTheme()
  const { language } = useLanguage()

  const features = language === "vi" ? [
    { icon: Code2, label: "Hoc Lap Trinh", description: "Kham pha the gioi code" },
    { icon: Zap, label: "Thu Thach", description: "Giai quyet cau do" },
    { icon: Gift, label: "Phan Thuong", description: "Nhan qua moi ngay" },
  ] : [
    { icon: Code2, label: "Learn Coding", description: "Explore the world of code" },
    { icon: Zap, label: "Challenges", description: "Solve puzzles" },
    { icon: Gift, label: "Rewards", description: "Get daily rewards" },
  ]

  const welcomeText = language === "vi" ? "Xin chao" : "Hello"
  const subtitleText = language === "vi" 
    ? "Chao mung den voi the gioi lap trinh!" 
    : "Welcome to the programming world!"
  const themeLabel = language === "vi" ? "Giao dien" : "Theme"
  const changeNameText = language === "vi" ? "Doi ten khac" : "Change Name"

  return (
    <div className="flex flex-col items-center gap-8 animate-scale-pop" data-testid="welcome-screen">
      {/* Welcome header */}
      <div className="relative text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <PartyPopper className="w-10 h-10 text-accent animate-wiggle" />
          <Stars className="w-8 h-8 text-highlight animate-pulse" />
          <PartyPopper className="w-10 h-10 text-accent animate-wiggle scale-x-[-1]" />
        </div>
        
        <h2 className="text-4xl md:text-5xl font-black text-foreground mb-3" data-testid="welcome-greeting">
          {welcomeText},{" "}
          <span className="text-primary inline-block animate-pulse">
            {name}!
          </span>
        </h2>
        
        <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
          <Smile className="w-6 h-6 text-accent" />
          <span>{subtitleText}</span>
          <Smile className="w-6 h-6 text-accent" />
        </div>
      </div>

      {/* Current theme badge */}
      <div className="px-6 py-3 bg-secondary/50 rounded-full border-2 border-primary/20">
        <span className="text-sm font-semibold text-secondary-foreground">
          {themeLabel}: <span className="text-primary">{themeName}</span>
        </span>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div
              key={index}
              className="group flex flex-col items-center gap-4 p-6 bg-card rounded-3xl shadow-xl border-2 border-primary/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-primary/30 cursor-pointer"
              style={{ animationDelay: `${index * 0.15}s` }}
              data-testid={`feature-card-${index}`}
            >
              <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                <Icon className="w-10 h-10 text-primary group-hover:animate-wiggle" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-card-foreground mb-1">{feature.label}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reset button */}
      <button
        onClick={onReset}
        className="mt-4 px-8 py-3 text-base font-semibold bg-muted text-muted-foreground rounded-full border-2 border-border transition-all duration-300 hover:bg-secondary hover:text-secondary-foreground hover:scale-105"
        data-testid="change-name-button"
      >
        {changeNameText}
      </button>
    </div>
  )
}
