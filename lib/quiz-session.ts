import type { Difficulty, QuestionDto } from '@/lib/subject-content/types'

export type Rng = () => number // [0, 1)

/** Fisher-Yates on a copy. Pure given `rng`. */
export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Take `k` random distinct elements (by position) from `arr`. */
export function sampleWithoutReplacement<T>(
  arr: readonly T[],
  k: number,
  rng: Rng = Math.random,
): T[] {
  if (k <= 0) return []
  if (k >= arr.length) return shuffle(arr, rng)
  return shuffle(arr, rng).slice(0, k)
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

/**
 * Choose the questions for one quiz session.
 *
 * - returns `min(n, pool.length)` distinct members of `pool`, shuffled
 * - difficulty-balanced: targets ~40% easy / ~40% medium / ~20% hard, filling any
 *   short bucket from the remaining pool (any difficulty)
 * - whole pool (shuffled) when `pool.length <= n`
 * - `[]` for an empty pool or `n <= 0`
 *
 * Pure — deterministic given `rng`.
 */
export function pickSessionQuestions(
  pool: readonly QuestionDto[],
  n: number,
  rng: Rng = Math.random,
): QuestionDto[] {
  if (n <= 0 || pool.length === 0) return []
  if (pool.length <= n) return shuffle(pool, rng)

  const targetEasy = Math.round(n * 0.4)
  const targetMedium = Math.round(n * 0.4)
  const target: Record<Difficulty, number> = {
    easy: targetEasy,
    medium: targetMedium,
    hard: n - targetEasy - targetMedium,
  }

  const buckets: Record<Difficulty, QuestionDto[]> = { easy: [], medium: [], hard: [] }
  for (const q of pool) buckets[q.difficulty].push(q)

  const picked: QuestionDto[] = []
  const takenIds = new Set<string>()
  for (const d of DIFFICULTIES) {
    const take = Math.min(target[d], buckets[d].length)
    for (const q of sampleWithoutReplacement(buckets[d], take, rng)) {
      picked.push(q)
      takenIds.add(q.id)
    }
  }

  if (picked.length < n) {
    const remaining = pool.filter((q) => !takenIds.has(q.id))
    picked.push(...sampleWithoutReplacement(remaining, n - picked.length, rng))
  }

  return shuffle(picked, rng)
}
