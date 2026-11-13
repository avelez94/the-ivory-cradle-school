import type { Metadata } from 'next'
import Image from 'next/image'
import { verifySerial, type VerificationResult } from '@/lib/certificates'
import { clientIpHash, rateLimit } from '@/lib/security'
import { longDate } from '@/lib/format'
import { hasDatabase } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Verify a Certificate',
  description: 'Check a certificate from The Ivory Cradle School using its full serial number.',
  robots: { index: false, follow: false, nocache: true },
}

type Props = { searchParams: Promise<{ serial?: string }> }

const STATUS: Record<string, { label: string; explain: string }> = {
  valid: { label: 'Valid', explain: 'This credential was issued by The Ivory Cradle School and is active.' },
  expired: { label: 'Expired', explain: 'This credential was issued by The Ivory Cradle School and has passed its expiration date.' },
  revoked: { label: 'Revoked', explain: 'This credential was issued by The Ivory Cradle School and is no longer valid.' },
  replaced: { label: 'Replaced', explain: 'This credential was replaced by a corrected credential with a different serial number. This serial number is no longer valid.' },
  not_valid: { label: 'Not valid', explain: 'Check the serial number and try again.' },
}

function ResultPanel({ result, serial }: { result: VerificationResult; serial: string }) {
  const s = STATUS[result.state]
  return (
    <section className={`result ${result.state}`} aria-live="polite" aria-labelledby="result-status">
      <h2 className="status" id="result-status">
        <span className="dot" aria-hidden="true" />
        {result.state === 'not_valid' ? 'Not valid. Check the serial number and try again.' : s.label}
      </h2>
      {result.state !== 'not_valid' && (
        <>
          <dl>
            <dt>Recipient</dt>
            <dd>{result.recipientName}</dd>
            <dt>Course or program</dt>
            <dd>{result.title}</dd>
            <dt>Credential type</dt>
            <dd>{result.credentialLabel}</dd>
            <dt>Issue date</dt>
            <dd>{longDate(result.issueDate)}</dd>
            {result.completionDate !== result.issueDate && (
              <>
                <dt>Completion date</dt>
                <dd>{longDate(result.completionDate)}</dd>
              </>
            )}
            <dt>Expiration</dt>
            <dd>{result.expiresOn ? longDate(result.expiresOn) : 'Does not expire'}</dd>
            <dt>Serial number</dt>
            <dd className="serial">{serial}</dd>
          </dl>
          <p className="explain">
            {s.explain}
            {result.sample && ' This is a sample credential.'}
          </p>
        </>
      )}
    </section>
  )
}

export default async function VerifyPage({ searchParams }: Props) {
  const { serial: raw } = await searchParams
  const input = typeof raw === 'string' ? raw.slice(0, 64) : ''
  let result: VerificationResult | null = null
  let limited = false
  const pending = !hasDatabase()
  if (input.trim() && !pending) {
    if (await rateLimit(`verify:${await clientIpHash()}`, 30, 600)) result = await verifySerial(input)
    else limited = true
  }

  return (
    <section className="band" style={{ background: 'var(--parchment)' }}>
      <div className="wrap" style={{ maxWidth: 820 }}>
        <Image src="/brand/wordmark.png" alt="" width={664} height={231} style={{ width: 170, height: 'auto' }} />
        <h1 className="h-section" style={{ marginTop: 28 }}>
          Verify a Certificate
        </h1>
        <p className="lede">
          Enter the full serial number printed on the certificate, or scan its QR code. Serial numbers start with ICS.
        </p>
        <form className="verify-form" method="get" action="/verify" role="search" aria-label="Verify a certificate">
          <label htmlFor="serial" className="sr-only">
            Serial number
          </label>
          <input
            id="serial"
            name="serial"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="ICS7KQ4M2XD9PRT"
            defaultValue={input}
            required
            maxLength={64}
          />
          <button className="btn" type="submit">
            Verify certificate
          </button>
        </form>
        {pending && (
          <p className="notice warn" role="status" style={{ marginTop: 24 }}>
            Certificate verification is opening soon.
          </p>
        )}
        {limited && (
          <p className="notice warn" role="alert" style={{ marginTop: 24 }}>
            Too many checks from this connection. Wait a few minutes and try again.
          </p>
        )}
        {result && <ResultPanel result={result} serial={input.trim().toUpperCase()} />}
        <p className="muted small" style={{ marginTop: 28 }}>
          Verification shows the name and details printed on the certificate. Student records, email addresses, and
          scores are never shown here.
        </p>
      </div>
    </section>
  )
}
