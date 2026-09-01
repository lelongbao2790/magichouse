import { createServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { BuyStickerSchema } from '@/lib/validation/api'
import { getOwnedStickers, purchaseSticker, InsufficientFundsError } from '@/lib/services/stickers'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const stickerIds = await getOwnedStickers(supabase, user.id)
    return apiSuccess(stickerIds)
  } catch (err) {
    console.error('[GET /api/players/stickers]', err)
    return apiError('Internal server error', 500)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return apiError('Not authenticated', 401)

    const body = await request.json()
    const parsed = BuyStickerSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    const { stickerId } = parsed.data

    const { data: sticker, error: stickerError } = await supabase
      .from('stickers')
      .select('price')
      .eq('id', stickerId)
      .single()

    if (stickerError || !sticker) return apiError('Sticker not found', 404)

    const result = await purchaseSticker(supabase, user.id, stickerId, sticker.price)
    return apiSuccess(result)
  } catch (err) {
    if (err instanceof InsufficientFundsError) {
      return apiError('Not enough coins', 400)
    }
    console.error('[POST /api/players/stickers]', err)
    return apiError('Internal server error', 500)
  }
}
