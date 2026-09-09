import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, SubjectRow, SubjectQuestionRow } from '@/lib/database.types'
import type { Locale, SubjectContentDto } from '@/lib/subject-content/types'
import { resolveQuestion, resolveTitle } from '@/lib/subject-content/resolve'

type Supabase = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Reads (anon/authenticated client — RLS: authenticated SELECT)
// ---------------------------------------------------------------------------

export async function listSubjects(supabase: Supabase): Promise<SubjectRow[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('sort_order')
    .order('key')

  if (error) throw error
  return data ?? []
}

export async function getSubjectByKey(
  supabase: Supabase,
  key: string,
): Promise<SubjectRow | null> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('key', key)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function getSubjectById(
  supabase: Supabase,
  id: string,
): Promise<SubjectRow | null> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function getQuestionById(
  supabase: Supabase,
  id: string,
): Promise<SubjectQuestionRow | null> {
  const { data, error } = await supabase
    .from('subject_questions')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

/** Highest `sort_order` among a subject's questions, or 0 if it has none. */
export async function maxSortOrder(
  supabase: Supabase,
  subjectId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from('subject_questions')
    .select('sort_order')
    .eq('subject_id', subjectId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.sort_order ?? 0
}

export async function getActiveQuestions(
  supabase: Supabase,
  subjectId: string,
): Promise<SubjectQuestionRow[]> {
  const { data, error } = await supabase
    .from('subject_questions')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('is_active', true)
    .order('sort_order')
    .order('created_at')

  if (error) throw error
  return data ?? []
}

/**
 * Orchestrator for the gameplay endpoint. Returns every ACTIVE question for the
 * subject, resolved to one language (business-logic-model §4).
 *   - unknown key            -> null (route -> 404)
 *   - incomplete active row  -> throws IncompleteQuestionError (route -> 500)
 *   - no active questions     -> { ..., questions: [] }
 */
export async function getSubjectContent(
  supabase: Supabase,
  key: string,
  uiLocale: Locale,
): Promise<SubjectContentDto | null> {
  const subject = await getSubjectByKey(supabase, key)
  if (!subject) return null

  const rows = await getActiveQuestions(supabase, subject.id)
  const questions = rows.map((row) => resolveQuestion(row, subject, uiLocale))

  return {
    key: subject.key,
    title: resolveTitle(subject, uiLocale),
    questionsPerSession: subject.questions_per_session,
    questions,
  }
}

// ---------------------------------------------------------------------------
// Writes — used only by the admin route (U3), only after the admin-email gate,
// with the service-role client. Declared here so the service module owns all
// subject_questions access.
// ---------------------------------------------------------------------------

export type SubjectQuestionWriteInput = {
  subjectId: string
  sourceKey?: string | null
  promptVi?: string | null
  promptEn?: string | null
  optionsVi?: string[] | null
  optionsEn?: string[] | null
  correctIndex: number
  difficulty: SubjectQuestionRow['difficulty']
  isActive?: boolean
  sortOrder?: number
}

function toRow(input: Partial<SubjectQuestionWriteInput>) {
  const row: Record<string, unknown> = {}
  if (input.subjectId !== undefined) row.subject_id = input.subjectId
  if (input.sourceKey !== undefined) row.source_key = input.sourceKey
  if (input.promptVi !== undefined) row.prompt_vi = input.promptVi
  if (input.promptEn !== undefined) row.prompt_en = input.promptEn
  if (input.optionsVi !== undefined) row.options_vi = input.optionsVi
  if (input.optionsEn !== undefined) row.options_en = input.optionsEn
  if (input.correctIndex !== undefined) row.correct_index = input.correctIndex
  if (input.difficulty !== undefined) row.difficulty = input.difficulty
  if (input.isActive !== undefined) row.is_active = input.isActive
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder
  return row
}

export async function listAllQuestionsForSubject(
  supabase: Supabase,
  subjectKey: string,
): Promise<SubjectQuestionRow[]> {
  const subject = await getSubjectByKey(supabase, subjectKey)
  if (!subject) return []
  const { data, error } = await supabase
    .from('subject_questions')
    .select('*')
    .eq('subject_id', subject.id)
    .order('sort_order')
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function createQuestion(
  supabase: Supabase,
  input: SubjectQuestionWriteInput,
): Promise<SubjectQuestionRow> {
  const { data, error } = await supabase
    .from('subject_questions')
    .insert(toRow(input) as never)
    .select('*')
    .single()
  if (error || !data) throw error ?? new Error('Failed to create question')
  return data
}

export async function updateQuestion(
  supabase: Supabase,
  id: string,
  patch: Partial<SubjectQuestionWriteInput>,
): Promise<SubjectQuestionRow> {
  const { data, error } = await supabase
    .from('subject_questions')
    .update(toRow(patch) as never)
    .eq('id', id)
    .select('*')
    .single()
  if (error || !data) throw error ?? new Error('Failed to update question')
  return data
}

export async function setQuestionActive(
  supabase: Supabase,
  id: string,
  isActive: boolean,
): Promise<SubjectQuestionRow> {
  return updateQuestion(supabase, id, { isActive })
}

export async function deleteQuestion(supabase: Supabase, id: string): Promise<void> {
  const { error } = await supabase.from('subject_questions').delete().eq('id', id)
  if (error) throw error
}
