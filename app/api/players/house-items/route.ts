import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { BuyHouseItemSchema } from '@/lib/validation/api'
import {
  getOwnedHouseItems,
  purchaseHouseItem,
  InsufficientFundsError,
} from '@/lib/services/house-items'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const itemIds = await getOwnedHouseItems(supabase, user.id)
    return apiSuccess(itemIds)
  } catch (err) {
    console.error('[GET /api/players/house-items]', err)
    return apiError('Internal server error', 500)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const body = await request.json()
    const parsed = BuyHouseItemSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    const { itemId } = parsed.data

    const { data: item, error: itemError } = await supabase
      .from('house_items')
      .select('price, is_active')
      .eq('id', itemId)
      .single()

    if (itemError || !item) return apiError('Item not found', 404)
    if (!item.is_active) return apiError('Item not available', 400)

    const result = await purchaseHouseItem(supabase, user.id, itemId, item.price)
    return apiSuccess(result)
  } catch (err) {
    if (err instanceof InsufficientFundsError) {
      return apiError('Not enough coins', 400)
    }
    console.error('[POST /api/players/house-items]', err)
    return apiError('Internal server error', 500)
  }
}
