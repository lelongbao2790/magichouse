export type Difficulty = 'easy' | 'medium' | 'hard'

// Derives difficulty from the largest operand in an arithmetic question.
// Thresholds: ≤10 = easy, ≤50 = medium, >50 = hard.
export function scoreDifficulty(maxOperand: number): Difficulty {
  if (maxOperand <= 10) return 'easy'
  if (maxOperand <= 50) return 'medium'
  return 'hard'
}

// Derives difficulty from the multiplier in a times-table question (range 2–9).
// Thresholds: ≤3 = easy, ≤6 = medium, >6 = hard.
export function timesTableDifficulty(multiplier: number): Difficulty {
  if (multiplier <= 3) return 'easy'
  if (multiplier <= 6) return 'medium'
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

export function calculateSessionCoins(difficulties: Difficulty[]): number {
  const dominant = dominantDifficulty(difficulties)
  if (dominant === 'easy') return 5
  if (dominant === 'medium') return 15
  return 25
}
