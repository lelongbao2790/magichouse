import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, PlacedHouseItem } from '@/lib/database.types'

type Supabase = SupabaseClient<Database>

// Thrown by saveLayout when any layoutData.itemId is not owned by the requesting
// player (BR-4) — the request is rejected in full, nothing is written.
export class ItemNotOwnedError extends Error {
  constructor() {
    super('One or more items in the layout are not owned by this player')
  }
}

export async function getLayout(
  supabase: Supabase,
  userId: string,
  room: string,
): Promise<PlacedHouseItem[]> {
  const { data, error } = await supabase
    .from('house_layout')
    .select('layout_data')
    .eq('player_id', userId)
    .eq('room', room)
    .single()

  if (error) {
    // PGRST116: no rows — player has not saved a layout for this room yet
    if (error.code === 'PGRST116') return []
    throw error
  }

  return (data?.layout_data ?? []) as PlacedHouseItem[]
}

export async function saveLayout(
  supabase: Supabase,
  userId: string,
  room: string,
  layoutData: PlacedHouseItem[],
): Promise<void> {
  // BR-4: every itemId referenced in layoutData must be owned by the caller,
  // checked BEFORE any write. Fails closed — on any violation, nothing is saved.
  const { data: owned, error: ownedError } = await supabase
    .from('player_house_items')
    .select('item_id')
    .eq('player_id', userId)

  if (ownedError) throw ownedError

  const ownedItemIds = new Set((owned ?? []).map((row) => row.item_id))
  const allOwned = layoutData.every((item) => ownedItemIds.has(item.itemId))
  if (!allOwned) throw new ItemNotOwnedError()

  // BR-5: duplicate itemIds within layoutData are allowed through — no distinct check.
  const { error } = await supabase
    .from('house_layout')
    .upsert(
      { player_id: userId, room, layout_data: layoutData, updated_at: new Date().toISOString() },
      { onConflict: 'player_id,room' },
    )

  if (error) throw error
}
