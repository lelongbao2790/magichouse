export type Difficulty = 'easy' | 'medium' | 'hard'

export function randomDifficulty(): Difficulty {
  const r = Math.random()
  if (r < 0.333) return 'easy'
  if (r < 0.667) return 'medium'
  return 'hard'
}

export function dominantDifficulty(difficulties: Difficulty[]): Difficulty {
  if (difficulties.length === 0) return 'easy'

  const counts = { easy: 0, medium: 0, hard: 0 }
  for (const d of difficulties) counts[d]++

  if (counts.hard >= counts.medium && counts.hard >= counts.easy) return 'hard'
  if (counts.medium >= counts.easy) return 'medium'
  return 'easy'
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function calculateSessionCoins(difficulties: Difficulty[]): number {
  const dominant = dominantDifficulty(difficulties)
  if (dominant === 'easy') return randomInt(5, 10)
  return randomInt(10, 30)
}
