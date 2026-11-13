import { ownedEnrollment } from '@/lib/api-guard'
import { fileResponse, getFile } from '@/lib/files'

export async function GET(req: Request, ctx: { params: Promise<{ enrollmentId: string }> }) {
  const { enrollmentId } = await ctx.params
  const owned = await ownedEnrollment(enrollmentId)
  if (owned instanceof Response) return owned
  const file = await getFile(owned.version.video_file_id)
  if (!file) return new Response('Video not available', { status: 404 })
  return fileResponse(file, req)
}
