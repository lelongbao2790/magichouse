import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type Supabase = SupabaseClient<Database>

export interface Player {
  id: string
  name: string
  coins: number
  createdAt: string
}

function toPlayer(row: Database['public']['Tables']['players']['Row']): Player {
  return {
    id: row.id,
    name: row.name,
    coins: row.coins,
    createdAt: row.created_at,
  }
}

export async function getPlayer(supabase: Supabase, userId: string): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .select('id, name, coins, created_at')
    .eq('id', userId)
    .single()

  if (error || !data) {
    throw new Error('Player not found')
  }

  return toPlayer(data)
}

export async function upsertPlayer(
  supabase: Supabase,
  userId: string,
  name: string
): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .upsert({ id: userId, name, coins: 0 }, { onConflict: 'id' })
    .select('id, name, coins, created_at')
    .single()

  if (error || !data) {
    throw new Error('Failed to create player profile')
  }

  return toPlayer(data)
}

export async function addCoins(supabase: Supabase, userId: string, amount: number): Promise<Player> {
  const current = await getPlayer(supabase, userId)
  const { data, error } = await supabase
    .from('players')
    .update({ coins: current.coins + amount })
    .eq('id', userId)
    .select('id, name, coins, created_at')
    .single()

  if (error || !data) throw new Error('Failed to add coins')
  return toPlayer(data)
}

export async function migrateFromLocalStorage(
  supabase: Supabase,
  userId: string,
  coins: number,
  stickerIds: string[]
): Promise<void> {
  const current = await getPlayer(supabase, userId)
  await supabase
    .from('players')
    .update({ coins: Math.max(current.coins, coins) })
    .eq('id', userId)

  if (stickerIds.length > 0) {
    await supabase
      .from('player_stickers')
      .upsert(
        stickerIds.map(sticker_id => ({ player_id: userId, sticker_id })),
        { onConflict: 'player_id,sticker_id', ignoreDuplicates: true }
      )
  }
}
