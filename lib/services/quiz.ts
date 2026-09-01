import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, QuizHistoryRow } from '@/lib/database.types'

type Supabase = SupabaseClient<Database>

interface QuizHistoryInsert {
  category: QuizHistoryRow['category']
  score: number
  totalQuestions: number
  coinsEarned: number
}

export async function recordHistory(
  supabase: Supabase,
  userId: string,
  record: QuizHistoryInsert
): Promise<void> {
  const { error } = await supabase.from('quiz_history').insert({
    player_id: userId,
    category: record.category,
    score: record.score,
    total_questions: record.totalQuestions,
    coins_earned: record.coinsEarned,
  })

  if (error) throw error
}

export async function getHistory(supabase: Supabase, userId: string): Promise<QuizHistoryRow[]> {
  const { data, error } = await supabase
    .from('quiz_history')
    .select('*')
    .eq('player_id', userId)
    .order('completed_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
