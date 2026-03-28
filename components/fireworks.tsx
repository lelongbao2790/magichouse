"use client"

import { useEffect, useState } from "react"

interface Particle {
  id: number
  x: number
  y: number
  color: string
  size: number
  velocityX: number
  velocityY: number
}

interface FireworksProps {
  isActive: boolean
  onComplete?: () => void
}

export function Fireworks({ isActive, onComplete }: FireworksProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!isActive) return

    const colors = [
      "#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#54a0ff",
      "#5f27cd", "#00d2d3", "#ff9f43", "#10ac84", "#ee5a24"
    ]

    // Create multiple explosion centers
    const explosions = [
      { x: 30, y: 40 },
      { x: 50, y: 30 },
      { x: 70, y: 45 },
      { x: 40, y: 50 },
      { x: 60, y: 35 },
    ]

    const newParticles: Particle[] = []
    let particleId = 0

    explosions.forEach((explosion) => {
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20
        const velocity = 3 + Math.random() * 4
        newParticles.push({
          id: particleId++,
          x: explosion.x,
          y: explosion.y,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 6 + Math.random() * 8,
          velocityX: Math.cos(angle) * velocity,
          velocityY: Math.sin(angle) * velocity,
        })
      }
    })

    setParticles(newParticles)

    // Clear after animation
    const timer = setTimeout(() => {
      setParticles([])
      onComplete?.()
    }, 2000)

    return () => clearTimeout(timer)
  }, [isActive, onComplete])

  if (!isActive || particles.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-firework-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            "--vx": particle.velocityX,
            "--vy": particle.velocityY,
          } as React.CSSProperties}
        />
      ))}
      
      {/* Celebration text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 animate-celebration-text drop-shadow-2xl">
          Tuyet voi!
        </div>
      </div>
    </div>
  )
}
