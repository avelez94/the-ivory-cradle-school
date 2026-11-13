import { db } from '@/lib/db'
import { certificatePdf, type CertificateRow } from '@/lib/certificates'

// The public, clearly labeled sample certificate shown on the homepage.
const SAMPLE_SERIAL = 'ICS7KQ4M2XD9PRT'

export async function GET() {
  const [row] = await db()`select * from certificates where serial = ${SAMPLE_SERIAL} and is_sample`
  if (!row) return new Response('Sample not available', { status: 404 })
  const bytes = await certificatePdf(row as unknown as CertificateRow)
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="Ivory-Cradle-School-Sample-Certificate.pdf"',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
