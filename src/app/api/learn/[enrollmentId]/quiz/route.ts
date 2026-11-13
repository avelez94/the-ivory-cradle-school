import { ownedEnrollment } from '@/lib/api-guard'
import { json, sameOrigin } from '@/lib/security'
import { submitQuiz } from '@/lib/quiz'
import { NotFoundError } from '@/lib/viewing'

// Grading happens here, on the server. The browser only ever receives the score and what to do next.
export async function POST(req: Request, ctx: { params: Promise<{ enrollmentId: string }> }) {
  if (!sameOrigin(req)) return json({ error: 'Forbidden' }, 403)
  const { enrollmentId } = await ctx.params
  const owned = await ownedEnrollment(enrollmentId)
  if (owned instanceof Response) return owned
  const body = await req.json().catch(() => null)
  const key = String(body?.submissionKey ?? '')
  const answers = body?.answers && typeof body.answers === 'object' ? (body.answers as Record<string, unknown>) : {}
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(key)) return json({ error: 'Invalid submission' }, 400)
  try {
    const result = await submitQuiz(owned.user.id, enrollmentId, key, answers)
    return json(result)
  } catch (e) {
    if (e instanceof NotFoundError) return json({ error: 'Not found' }, 404)
    throw e
  }
}
