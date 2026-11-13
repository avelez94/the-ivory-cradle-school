import { ownedEnrollment } from '@/lib/api-guard'
import { fileResponse, getFile } from '@/lib/files'

// The worksheet is available as soon as the student is enrolled.
export async function GET(req: Request, ctx: { params: Promise<{ enrollmentId: string }> }) {
  const { enrollmentId } = await ctx.params
  const owned = await ownedEnrollment(enrollmentId)
  if (owned instanceof Response) return owned
  const file = await getFile(owned.version.worksheet_file_id)
  if (!file) return new Response('Worksheet not available', { status: 404 })
  const download = new URL(req.url).searchParams.get('download') === '1'
  const name = `${owned.version.title.replace(/[^A-Za-z0-9 ]/g, '').replace(/ +/g, ' ').trim()} Worksheet.pdf`
  return fileResponse(file, req, { disposition: download ? 'attachment' : 'inline', downloadName: name })
}
