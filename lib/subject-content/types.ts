import type { Difficulty } from '@/lib/coin-rewards'

export type { Difficulty }

export type Locale = 'vi' | 'en'
export type ContentMode = 'fixed' | 'localized'

/** One quiz question, resolved to a single language and ready for <QuizModal>. */
export interface QuestionDto {
  id: string
  question: string
  options: string[] // length 3
  correctIndex: number // 0..2
  difficulty: Difficulty
}

/** A subject's full active question set, resolved for the requesting UI locale. */
export interface SubjectContentDto {
  key: string
  title: string
  questionsPerSession: number
  questions: QuestionDto[]
}
