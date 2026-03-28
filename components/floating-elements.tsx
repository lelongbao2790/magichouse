"use client"

import { Star, Heart, Sparkles, Circle } from "lucide-react"

export function FloatingElements() {
  const elements = [
    { Icon: Star, className: "top-[10%] left-[5%] text-accent w-8 h-8", delay: 0, fill: true },
    { Icon: Heart, className: "top-[15%] right-[8%] text-primary w-6 h-6", delay: 0.5, fill: true },
    { Icon: Sparkles, className: "top-[25%] left-[12%] text-highlight w-5 h-5", delay: 1 },
    { Icon: Circle, className: "top-[8%] left-[30%] text-secondary w-4 h-4", delay: 0.3, fill: true },
    { Icon: Star, className: "top-[20%] right-[15%] text-accent w-5 h-5", delay: 0.7, fill: true },
    { Icon: Heart, className: "bottom-[30%] left-[8%] text-primary w-7 h-7", delay: 1.2, fill: true },
    { Icon: Sparkles, className: "bottom-[25%] right-[5%] text-highlight w-6 h-6", delay: 0.8 },
    { Icon: Circle, className: "bottom-[15%] left-[15%] text-accent w-3 h-3", delay: 0.4, fill: true },
    { Icon: Star, className: "bottom-[20%] right-[12%] text-secondary w-5 h-5", delay: 1.5, fill: true },
    { Icon: Circle, className: "top-[40%] left-[3%] text-primary/50 w-6 h-6", delay: 0.9, fill: true },
    { Icon: Heart, className: "top-[50%] right-[3%] text-accent/60 w-5 h-5", delay: 1.1, fill: true },
  ]

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {elements.map((el, index) => {
        const Icon = el.Icon
        return (
          <div
            key={index}
            className={`absolute animate-float opacity-60 ${el.className}`}
            style={{ animationDelay: `${el.delay}s` }}
          >
            <Icon className={`w-full h-full ${el.fill ? "fill-current" : ""}`} />
          </div>
        )
      })}
    </div>
  )
}
