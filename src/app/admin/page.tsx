import Link from 'next/link'
import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { dateTime } from '@/lib/format'

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireStaff()
  const { denied } = await searchParams
  const [counts] = await db()`
    select
      (select count(*)::int from users where role = 'student') as students,
      (select count(*)::int from enrollments) as enrollments,
      (select count(*)::int from enrollments where status = 'completed') as completions,
      (select count(*)::int from certificates where not is_sample) as certificates,
      (select count(*)::int from contact_messages where handled_at is null) as open_messages,
      (select count(*)::int from courses where status = 'published') as live_courses`
  const recent = await db()`
    select a.created_at, a.action, a.entity_type, a.reason, u.full_name
    from audit_events a left join users u on u.id = a.actor_id
    order by a.created_at desc limit 12`
  return (
    <>
      <h1>Welcome, {user.fullName.split(' ')[0]}</h1>
      {denied && <p className="notice warn" style={{ marginTop: 16 }}>That area is limited to administrators.</p>}
      <div className="stat-grid">
        <div className="stat"><b>{counts.students}</b>Students</div>
        <div className="stat"><b>{counts.enrollments}</b>Enrollments</div>
        <div className="stat"><b>{counts.completions}</b>Completions</div>
        <div className="stat"><b>{counts.certificates}</b>Issued certificates</div>
        <div className="stat"><b>{counts.live_courses}</b>Published courses</div>
        <div className="stat"><b>{counts.open_messages}</b><Link href="/admin/messages">Open messages</Link></div>
      </div>
      <h2>Recent activity</h2>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>When</th><th>Who</th><th>What</th><th>Note</th></tr></thead>
          <tbody>
            {recent.map((r, i) => (
              <tr key={i}>
                <td>{dateTime(r.created_at)}</td>
                <td>{r.full_name ?? 'System'}</td>
                <td>{r.entity_type}: {r.action.replace(/_/g, ' ')}</td>
                <td className="muted">{r.reason ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
