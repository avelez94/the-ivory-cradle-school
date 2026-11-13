import { ownedEnrollment, isUuid } from '@/lib/api-guard'
import { json, sameOrigin } from '@/lib/security'
import { recordBeat, NotFoundError } from '@/lib/viewing'

export async function POST(req: Request, ctx: { params: Promise<{ enrollmentId: string }> }) {
  if (!sameOrigin(req)) return json({ error: 'Forbidden' }, 403)
  const { enrollmentId } = await ctx.params
  const owned = await ownedEnrollment(enrollmentId)
  if (owned instanceof Response) return owned
  const body = await req.json().catch(() => null)
  const cycleId = String(body?.cycleId ?? '')
  const position = Number(body?.position)
  if (!isUuid(cycleId) || !Number.isFinite(position)) return json({ error: 'Invalid progress report' }, 400)
  try {
    const state = await recordBeat(owned.user.id, enrollmentId, cycleId, position)
    return json({
      cycleId: state.cycleId,
      status: state.status,
      watchedSeconds: state.watchedSeconds,
      remainingSeconds: state.remainingSeconds,
      viewingComplete: state.viewingComplete,
      accepted: state.accepted,
    })
  } catch (e) {
    if (e instanceof NotFoundError) return json({ error: 'Not found' }, 404)
    throw e
  }
}
