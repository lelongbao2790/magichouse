import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, CanvasItem } from '@/lib/database.types'

type Supabase = SupabaseClient<Database>

export async function getCanvas(supabase: Supabase, userId: string): Promise<CanvasItem[]> {
  const { data, error } = await supabase
    .from('creative_canvas')
    .select('canvas_data')
    .eq('player_id', userId)
    .single()

  if (error) {
    // PGRST116: no rows — player has not saved a canvas yet
    if (error.code === 'PGRST116') return []
    throw error
  }

  return (data?.canvas_data ?? []) as CanvasItem[]
}

export async function saveCanvas(
  supabase: Supabase,
  userId: string,
  canvasData: CanvasItem[]
): Promise<void> {
  const { error } = await supabase
    .from('creative_canvas')
    .upsert(
      { player_id: userId, canvas_data: canvasData, updated_at: new Date().toISOString() },
      { onConflict: 'player_id' }
    )

  if (error) throw error
}
