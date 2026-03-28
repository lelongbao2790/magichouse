import type { StickerItem } from "@/contexts/coin-context"

export const allStickers: StickerItem[] = [
  // Hats
  { id: "hat-crown", name: "Vuong mien", category: "hat", emoji: "👑", price: 30 },
  { id: "hat-wizard", name: "Mu phu thuy", category: "hat", emoji: "🎩", price: 25 },
  { id: "hat-party", name: "Mu tiec", category: "hat", emoji: "🥳", price: 15 },
  { id: "hat-cowboy", name: "Mu cao boi", category: "hat", emoji: "🤠", price: 20 },
  { id: "hat-cap", name: "Mu luoi trai", category: "hat", emoji: "🧢", price: 10 },
  { id: "hat-santa", name: "Mu Noel", category: "hat", emoji: "🎅", price: 25 },
  
  // Glasses
  { id: "glasses-sun", name: "Kinh mat", category: "glasses", emoji: "🕶️", price: 15 },
  { id: "glasses-nerd", name: "Kinh can", category: "glasses", emoji: "🤓", price: 10 },
  { id: "glasses-star", name: "Kinh ngoi sao", category: "glasses", emoji: "⭐", price: 20 },
  { id: "glasses-heart", name: "Kinh trai tim", category: "glasses", emoji: "💖", price: 20 },
  { id: "glasses-3d", name: "Kinh 3D", category: "glasses", emoji: "👓", price: 15 },
  
  // Bows
  { id: "bow-ribbon", name: "No hong", category: "bow", emoji: "🎀", price: 15 },
  { id: "bow-flower", name: "Hoa cai dau", category: "bow", emoji: "🌸", price: 20 },
  { id: "bow-butterfly", name: "Buom", category: "bow", emoji: "🦋", price: 25 },
  { id: "bow-star", name: "Sao", category: "bow", emoji: "✨", price: 15 },
  { id: "bow-rainbow", name: "Cau vong", category: "bow", emoji: "🌈", price: 30 },
  
  // Toys
  { id: "toy-balloon", name: "Bong bay", category: "toy", emoji: "🎈", price: 10 },
  { id: "toy-teddy", name: "Gau bong", category: "toy", emoji: "🧸", price: 25 },
  { id: "toy-rocket", name: "Ten lua", category: "toy", emoji: "🚀", price: 30 },
  { id: "toy-ball", name: "Qua bong", category: "toy", emoji: "⚽", price: 15 },
  { id: "toy-magic", name: "Gay phep", category: "toy", emoji: "🪄", price: 35 },
  { id: "toy-robot", name: "Robot", category: "toy", emoji: "🤖", price: 40 },
]

export const stickerCategories = [
  { id: "hat", name: "Mu & Non", icon: "👒" },
  { id: "glasses", name: "Kinh mat", icon: "👓" },
  { id: "bow", name: "No & Trang tri", icon: "🎀" },
  { id: "toy", name: "Do choi", icon: "🧸" },
] as const

export function getStickersByCategory(category: string) {
  return allStickers.filter((s) => s.category === category)
}

export function getStickerById(id: string) {
  return allStickers.find((s) => s.id === id)
}
