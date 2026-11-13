import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { isUuid } from '@/lib/api-guard'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { dateTime, longDate } from '@/lib/format'
import { replaceAction, revokeAction } from '../../records-actions'

const SAVED: Record<string, string> = {
  revoked: 'Credential revoked. Verification now shows Revoked.',
  replacement: 'Corrected replacement issued with a new serial. The original now verifies as Replaced.',
}
const ERRORS: Record<string, string> = {
  reason: 'Enter a reason of at least 5 characters. Reasons stay private to staff.',
  replace: 'Fill in every field, with a reason of at least 5 characters.',
  state: 'That change is not possible for this credential in its current state.',
}

export default async function CertificateAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { id } = await params
  const { saved, error } = await searchParams
  if (!isUuid(id)) notFound()
  const user = await getCurrentUser()
  const admin = isAdmin(user)
  const [c] = await db()`
    select c.*, u.email, s.label as signature_label,
      r1.serial as replaces_serial, r2.serial as replaced_by_serial
    from certificates c left join users u on u.id = c.user_id left join signature_sets s on s.id = c.signature_set_id
    left join certificates r1 on r1.id = c.replaces_id left join certificates r2 on r2.id = c.replaced_by_id
    where c.id = ${id}`
  if (!c) notFound()
  const events = await db()`select a.*, u.full_name from audit_events a left join users u on u.id = a.actor_id
    where a.entity_type = 'certificate' and a.entity_id = ${id} order by a.created_at desc`

  return (
    <>
      <p className="crumbs"><Link href="/admin/certificates">Certificates</Link> / <span className="serial">{c.serial}</span></p>
      <h1 className="serial" style={{ fontFamily: 'inherit' }}>{c.serial}</h1>
      {saved && <p className="notice ok" style={{ marginTop: 12 }}>{SAVED[saved]}</p>}
      {error && <p className="notice bad" style={{ marginTop: 12 }}>{ERRORS[error]}</p>}
      <div className="table-wrap">
        <table className="data">
          <tbody>
            <tr><th>Status</th><td>{c.status}{c.is_sample ? ' (staging sample)' : ''}</td></tr>
            <tr><th>Recipient as printed</th><td>{c.recipient_name}</td></tr>
            <tr><th>Student account</th><td>{c.email ?? 'None (sample record)'}</td></tr>
            <tr><th>Course title as printed</th><td>{c.course_title}</td></tr>
            <tr><th>Credential type</th><td>{c.credential_label}</td></tr>
            <tr><th>Completion date</th><td>{longDate(c.completion_date)}</td></tr>
            <tr><th>Issue date</th><td>{longDate(c.issue_date)}</td></tr>
            <tr><th>Expiration</th><td>{c.expires_on ? longDate(c.expires_on) : 'Does not expire'}</td></tr>
            <tr><th>Signature version</th><td>{c.signature_label ?? 'Placeholder (no artwork)'}</td></tr>
            <tr><th>Verification address</th><td>{c.verification_url}</td></tr>
            {c.replaces_serial && <tr><th>Replaces</th><td className="serial">{c.replaces_serial}</td></tr>}
            {c.replaced_by_serial && <tr><th>Replaced by</th><td className="serial">{c.replaced_by_serial}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="toolbar">
        <a className="btn small" href={`/api/certificates/${c.id}/pdf`}>Download issued PDF</a>
        <a className="btn outline small" href={`/verify?serial=${c.serial}`} target="_blank">Open public verification</a>
      </div>

      {admin && c.status !== 'replaced' && (
        <div className="editor-grid" style={{ marginTop: 28 }}>
          <form action={replaceAction} className="panel form">
            <input type="hidden" name="certificateId" value={c.id} />
            <h2 className="h-card" style={{ margin: 0 }}>Correct and reissue</h2>
            <p className="muted small">Issues a corrected certificate with a new serial and marks this one Replaced. The student downloads the new one from their dashboard.</p>
            <div className="field"><label htmlFor="rn">Recipient name</label><input id="rn" name="recipientName" type="text" defaultValue={c.recipient_name} required /></div>
            <div className="field"><label htmlFor="ct">Course title</label><input id="ct" name="courseTitle" type="text" defaultValue={c.course_title} required /></div>
            <div className="field"><label htmlFor="cd">Completion date</label><input id="cd" name="completionDate" type="date" defaultValue={c.completion_date} required /></div>
            <div className="field"><label htmlFor="rr">Reason (private)</label><input id="rr" name="reason" type="text" required minLength={5} /></div>
            <div><button className="btn" type="submit">Issue corrected replacement</button></div>
          </form>
          {c.status === 'active' && (
            <form action={revokeAction} className="panel form">
              <input type="hidden" name="certificateId" value={c.id} />
              <h2 className="h-card" style={{ margin: 0 }}>Revoke</h2>
              <p className="muted small">Verification will show Revoked. The reason is never shown publicly.</p>
              <div className="field"><label htmlFor="vr">Reason (private)</label><input id="vr" name="reason" type="text" required minLength={5} /></div>
              <div><button className="btn dark" type="submit">Revoke credential</button></div>
            </form>
          )}
        </div>
      )}
      {!admin && <p className="muted small" style={{ marginTop: 20 }}>Corrections, revocations, and reissues are limited to administrators.</p>}

      <h2>Audit trail</h2>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>When</th><th>Action</th><th>By</th><th>Reason</th></tr></thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}><td>{dateTime(ev.created_at)}</td><td>{ev.action.replace(/_/g, ' ')}</td><td>{ev.full_name ?? 'System'}</td><td>{ev.reason ?? ''}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
