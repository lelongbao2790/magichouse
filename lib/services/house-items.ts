import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { InsufficientFundsError } from '@/lib/services/stickers'

type Supabase = SupabaseClient<Database>
type Locale = 'vi' | 'en'

// Re-exported so route modules only need one import path for the purchase-guard error
// (Q5=A — one shared error type across the app, not a duplicate).
export { InsufficientFundsError }

// Catalog entry, server-side localized (FR-2.1): a single `name` field selected from
// name_vi/name_en, matching the subject-content-db `?locale=` precedent — not the
// older Sticker Shop client-side nameMap pattern.
export interface HouseItemCatalogEntry {
  id: string
  room: string
  name: string
  emoji: string
  price: number
}

// One room tab, server-side localized the same way (BR-2).
export interface RoomTab {
  id: string
  label: string
  locked: boolean
}

export async function getCatalog(
  supabase: Supabase,
  room: string,
  locale: Locale,
): Promise<HouseItemCatalogEntry[]> {
  const { data, error } = await supabase
    .from('house_items')
    .select('id, room, name_vi, name_en, emoji, price')
    .eq('room', room)
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    room: row.room,
    name: locale === 'vi' ? row.name_vi : row.name_en,
    emoji: row.emoji,
    price: row.price,
  }))
}

export async function getOwnedHouseItems(supabase: Supabase, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('player_house_items')
    .select('item_id')
    .eq('player_id', userId)

  if (error) throw error
  return (data ?? []).map((row) => row.item_id)
}

export async function purchaseHouseItem(
  supabase: Supabase,
  userId: string,
  itemId: string,
  price: number,
): Promise<{ newCoinBalance: number }> {
  // BR-3/BR-8/PBT-G: the affordability guard + idempotent ownership insert run
  // atomically in ONE Postgres transaction, via the `purchase_house_item` function
  // (supabase/migrations/0004_house_items_schema.sql). Two independent round trips
  // from this client (e.g. "check ownership, then charge") cannot be made airtight
  // against concurrent duplicate requests, AND `player_house_items`'s RLS policies
  // only grant this RLS-scoped client SELECT/INSERT (no UPDATE/DELETE) — so any
  // "insert then compensate with a delete on guard failure" pattern from this client
  // would silently no-op its own delete. The SECURITY DEFINER function sidesteps
  // both problems: it locks the player's row for its duration (serializing concurrent
  // purchases of the same item by the same player — no double-charge) and simply
  // rolls back on an insufficient-funds failure (nothing was written, so nothing
  // needs undoing).
  const { data, error } = await supabase.rpc('purchase_house_item', {
    p_player_id: userId,
    p_item_id: itemId,
    p_price: price,
  })

  if (error) {
    if (error.message.includes('insufficient_funds')) throw new InsufficientFundsError()
    throw error
  }

  const result = Array.isArray(data) ? data[0] : data
  if (!result) throw new Error('purchase_house_item returned no result')

  return { newCoinBalance: result.new_coin_balance }
}

export async function getRooms(supabase: Supabase, locale: Locale): Promise<RoomTab[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, label_vi, label_en, is_unlocked')

  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    label: locale === 'vi' ? row.label_vi : row.label_en,
    locked: !row.is_unlocked,
  }))
}
