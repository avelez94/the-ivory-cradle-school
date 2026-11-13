import { ownedEnrollment } from '@/lib/api-guard'
import { fileResponse, getFile } from '@/lib/files'

export async function GET(req: Request, ctx: { params: Promise<{ enrollmentId: string }> }) {
  const { enrollmentId } = await ctx.params
  const owned = await ownedEnrollment(enrollmentId)
  if (owned instanceof Response) return owned
  const file = await getFile(owned.version.captions_file_id)
  if (!file) return new Response('Captions not available', { status: 404 })
  return fileResponse({ ...file, content_type: 'text/vtt; charset=utf-8' }, req)
}
