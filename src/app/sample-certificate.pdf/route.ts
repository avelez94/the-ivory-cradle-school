import { db, hasDatabase } from '@/lib/db'
import { config } from '@/lib/config'
import { renderCertificatePdf } from '@/lib/certificate-pdf'
import { certificatePdf, type CertificateRow } from '@/lib/certificates'

// The public, clearly labeled sample certificate shown on the homepage.
const SAMPLE_SERIAL = 'ICS7KQ4M2XD9PRT'

export async function GET() {
  if (!hasDatabase()) {
    // Before the database exists: the same sample, with labeled placeholders where the signatures go.
    const bytes = await renderCertificatePdf({
      serial: SAMPLE_SERIAL, recipientName: 'Jordan Taylor', courseTitle: 'The First Overnight Shift',
      completionDate: '2026-11-12', issueDate: '2026-11-12', verificationUrl: `${config.siteUrl}/v/${SAMPLE_SERIAL}`,
      sample: true, issuedAt: new Date('2026-11-12T12:00:00Z'), alanteSignature: null, justineSignature: null,
    })
    return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'public, max-age=300' } })
  }
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
