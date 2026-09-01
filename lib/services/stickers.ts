import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, StickerRow } from '@/lib/database.types'

type Supabase = SupabaseClient<Database>

export class InsufficientFundsError extends Error {
  constructor() {
    super('Not enough coins')
  }
}

export async function getCatalog(supabase: Supabase): Promise<StickerRow[]> {
  const { data, error } = await supabase
    .from('stickers')
    .select('*')
    .order('category')
    .order('price')

  if (error) throw error
  return data ?? []
}

export async function getOwnedStickers(supabase: Supabase, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('player_stickers')
    .select('sticker_id')
    .eq('player_id', userId)

  if (error) throw error
  return (data ?? []).map(row => row.sticker_id)
}

export async function purchaseSticker(
  supabase: Supabase,
  userId: string,
  stickerId: string,
  price: number
): Promise<{ newCoinBalance: number }> {
  // Read current balance to compute new value (Supabase SDK cannot do SQL expressions in update body)
  const { data: playerData, error: readError } = await supabase
    .from('players')
    .select('coins')
    .eq('id', userId)
    .single()

  if (readError || !playerData) throw readError ?? new Error('Player not found')

  // SQL-level guard via PostgREST WHERE clause: UPDATE ... WHERE id = $1 AND coins >= $2 (Q1=B)
  // .gte('coins', price) translates to AND coins >= price in the UPDATE statement
  const { data: updated, error: deductError } = await supabase
    .from('players')
    .update({ coins: playerData.coins - price })
    .eq('id', userId)
    .gte('coins', price)
    .select('coins')

  if (deductError) throw deductError
  if (!updated || updated.length === 0) throw new InsufficientFundsError()

  // Insert ownership — idempotent: ON CONFLICT (player_id, sticker_id) DO NOTHING
  await supabase
    .from('player_stickers')
    .upsert(
      { player_id: userId, sticker_id: stickerId },
      { onConflict: 'player_id,sticker_id', ignoreDuplicates: true }
    )

  return { newCoinBalance: updated[0].coins }
}
