import { getCurrentUser, isAdmin, isStaff } from '@/lib/auth'
import { isUuid } from '@/lib/api-guard'
import { fileResponse, getFile } from '@/lib/files'

// Staff previews of course files. Signature artwork is limited to administrators.
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getCurrentUser()
  if (!user || !isStaff(user) || !isUuid(id)) return new Response('Not found', { status: 404 })
  const file = await getFile(id)
  if (!file) return new Response('Not found', { status: 404 })
  if (file.kind === 'signature' && !isAdmin(user)) return new Response('Not found', { status: 404 })
  const type = file.kind === 'captions' ? 'text/plain; charset=utf-8' : file.content_type
  return fileResponse({ ...file, content_type: type }, req)
}
