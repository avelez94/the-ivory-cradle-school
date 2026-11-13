import { getCurrentUser, isStaff } from '@/lib/auth'
import { isUuid } from '@/lib/api-guard'
import { certificatePdf, getCertificate } from '@/lib/certificates'

// Certificate files are private: only the student who earned one and authorized staff can download it.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getCurrentUser()
  if (!user) return new Response('Sign in required', { status: 401 })
  if (!isUuid(id)) return new Response('Not found', { status: 404 })
  const cert = await getCertificate(id)
  const staff = isStaff(user)
  if (!cert || (!staff && cert.user_id !== user.id)) return new Response('Not found', { status: 404 })
  if (!staff && cert.status !== 'active') {
    return new Response('This certificate was replaced or revoked. Download the current certificate from your dashboard.', { status: 410 })
  }
  const bytes = await certificatePdf(cert)
  const safeName = cert.recipient_name.replace(/[^A-Za-z0-9 ]/g, '').trim().replace(/ +/g, ' ')
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Certificate ${cert.serial} ${safeName}.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}
