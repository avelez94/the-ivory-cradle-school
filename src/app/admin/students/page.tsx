import Link from 'next/link'
import { db } from '@/lib/db'
import { dateTime } from '@/lib/format'

export default async function StudentsAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const term = (q ?? '').trim()
  const like = `%${term.toLowerCase()}%`
  const rows = await db()`
    select e.id, e.status, e.enrolled_at, e.completed_at, u.full_name, u.email, v.title, v.version_no, v.video_duration_seconds as duration,
      cy.cycle_no, cy.status as cycle_status, cy.watched_seconds,
      (select count(*)::int from quiz_attempts a where a.cycle_id = cy.id) as attempts,
      (select count(*)::int from quiz_attempts a where a.enrollment_id = e.id) as total_attempts,
      (select serial from certificates c where c.enrollment_id = e.id and c.status = 'active' limit 1) as serial
    from enrollments e
    join users u on u.id = e.user_id
    join course_versions v on v.id = e.course_version_id
    left join lateral (select * from viewing_cycles x where x.enrollment_id = e.id order by cycle_no desc limit 1) cy on true
    where ${term ? db()`(lower(u.full_name) like ${like} or lower(u.email) like ${like})` : db()`true`}
    order by e.enrolled_at desc limit 200`
  return (
    <>
      <h1>Students &amp; progress</h1>
      <form className="toolbar" method="get">
        <label className="sr-only" htmlFor="q">Search students</label>
        <input id="q" name="q" type="text" placeholder="Search by name or email" defaultValue={term} style={{ maxWidth: 360 }} />
        <button className="btn outline small" type="submit">Search</button>
      </form>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Student</th><th>Course</th><th>Viewing</th><th>Quiz</th><th>Status</th><th>Certificate</th><th>Enrolled</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="muted">No enrollments yet.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/admin/students/${r.id}`}><b>{r.full_name}</b></Link><br /><span className="muted small">{r.email}</span></td>
                <td>{r.title}<br /><span className="muted small">Version {r.version_no}</span></td>
                <td>Viewing {r.cycle_no}: {Math.round((Number(r.watched_seconds) / Number(r.duration)) * 100)}%<br /><span className="muted small">{r.cycle_status.replace('_', ' ')}</span></td>
                <td>{r.attempts} of 3 this viewing<br /><span className="muted small">{r.total_attempts} total</span></td>
                <td>{r.status}</td>
                <td>{r.serial ? <span className="serial">{r.serial}</span> : ''}</td>
                <td>{dateTime(r.enrolled_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
