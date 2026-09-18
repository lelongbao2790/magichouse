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
    .upsert({ id: userId, name }, { onConflict: 'id' })
    .select('id, name, coins, created_at')
    .single()

  if (error || !data) {
    throw new Error('Failed to create player profile')
  }

  return toPlayer(data)
}

export async function addCoins(supabase: Supabase, userId: string, amount: number): Promise<Player> {
  // Uses the increment_player_coins RPC (supabase/migrations/0005_increment_coins_rpc.sql)
  // so that `coins = coins + amount` is evaluated atomically in a single SQL statement,
  // eliminating the race-condition coin loss that the old read-then-write pattern caused.
  const { data, error } = await supabase.rpc('increment_player_coins', {
    p_player_id: userId,
    p_amount: amount,
  })

  if (error) throw new Error('Failed to add coins')
  const result = Array.isArray(data) ? data[0] : data
  if (!result) throw new Error('Failed to add coins')
  return { id: result.id, name: result.name, coins: result.coins, createdAt: result.created_at }
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
