import { apiSuccess, apiError } from '@/lib/api-response'
import { requireAdmin, isResponse } from '@/lib/admin-guard'
import { listSubjects } from '@/lib/services/subject-content'

export async function GET(request: Request) {
  try {
    const ctx = await requireAdmin(request)
    if (isResponse(ctx)) return ctx

    const rows = await listSubjects(ctx.admin)
    return apiSuccess(rows)
  } catch (err) {
    console.error('[GET /api/admin/subjects]', err)
    return apiError('Internal server error', 500)
  }
}
