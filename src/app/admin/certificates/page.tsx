import Link from 'next/link'
import { db } from '@/lib/db'
import { longDate } from '@/lib/format'

export default async function CertificatesAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams
  const term = (q ?? '').trim()
  const like = `%${term.toLowerCase()}%`
  const st = ['active', 'revoked', 'replaced'].includes(status ?? '') ? status! : null
  const rows = await db()`
    select c.id, c.serial, c.recipient_name, c.course_title, c.issue_date, c.expires_on, c.status, c.is_sample, u.email
    from certificates c left join users u on u.id = c.user_id
    where ${term ? db()`(c.serial = ${term.toUpperCase()} or lower(c.recipient_name) like ${like} or lower(coalesce(u.email, '')) like ${like})` : db()`true`}
      and ${st ? db()`c.status = ${st}` : db()`true`}
    order by c.issued_at desc limit 200`
  return (
    <>
      <h1>Certificates</h1>
      <p className="muted" style={{ marginTop: 8 }}>Staff search. The public verification page only accepts a full serial number.</p>
      <form className="toolbar" method="get">
        <label className="sr-only" htmlFor="q">Search</label>
        <input id="q" name="q" type="text" placeholder="Serial, name, or email" defaultValue={term} style={{ maxWidth: 320 }} />
        <label className="sr-only" htmlFor="st">Status</label>
        <select id="st" name="status" defaultValue={st ?? ''} style={{ width: 'auto' }}>
          <option value="">All statuses</option><option value="active">Active</option><option value="revoked">Revoked</option><option value="replaced">Replaced</option>
        </select>
        <button className="btn outline small" type="submit">Search</button>
      </form>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Serial</th><th>Recipient</th><th>Course</th><th>Issued</th><th>Expires</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><Link className="serial" href={`/admin/certificates/${r.id}`}>{r.serial}</Link>{r.is_sample && <span className="muted small"> sample</span>}</td>
                <td>{r.recipient_name}<br /><span className="muted small">{r.email ?? ''}</span></td>
                <td>{r.course_title}</td>
                <td>{longDate(r.issue_date)}</td>
                <td>{r.expires_on ? longDate(r.expires_on) : 'Does not expire'}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
