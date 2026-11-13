import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { isUuid } from '@/lib/api-guard'
import { dateTime, duration } from '@/lib/format'
import type { CourseContent } from '@/lib/courses'
import { accommodationAction } from '../../records-actions'

export default async function EnrollmentAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params
  const { saved } = await searchParams
  if (!isUuid(id)) notFound()
  const [e] = await db()`
    select e.*, u.full_name, u.email, v.title, v.version_no, v.content, v.video_duration_seconds as duration
    from enrollments e join users u on u.id = e.user_id join course_versions v on v.id = e.course_version_id where e.id = ${id}`
  if (!e) notFound()
  const cycles = await db()`select * from viewing_cycles where enrollment_id = ${id} order by cycle_no`
  const attempts = await db()`select a.*, c.cycle_no from quiz_attempts a join viewing_cycles c on c.id = a.cycle_id where a.enrollment_id = ${id} order by a.submitted_at`
  const certs = await db()`select id, serial, status, recipient_name, issue_date from certificates where enrollment_id = ${id} order by issued_at`
  const events = await db()`select a.*, u.full_name from audit_events a left join users u on u.id = a.actor_id where a.entity_type = 'enrollment' and a.entity_id = ${id} order by a.created_at desc`
  const content = e.content as CourseContent
  const latest = cycles[cycles.length - 1]

  return (
    <>
      <p className="crumbs"><Link href="/admin/students">Students</Link> / {e.full_name}</p>
      <h1>{e.full_name}</h1>
      <p className="muted" style={{ marginTop: 6 }}>{e.email} · {e.title} (version {e.version_no}) · enrolled {dateTime(e.enrolled_at)} · {e.status}</p>
      <p style={{ marginTop: 6 }}>Certificate name: <b>{e.certificate_name ?? 'not set'}</b> {e.certificate_name_confirmed_at ? `(confirmed ${dateTime(e.certificate_name_confirmed_at)})` : '(not confirmed)'}</p>
      {saved && <p className="notice ok" style={{ marginTop: 12 }}>Accommodation recorded. The quiz is unlocked for this viewing.</p>}

      <h2>Viewing history</h2>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Viewing</th><th>Status</th><th>Watched</th><th>Started</th><th>Completed</th><th>Reports</th></tr></thead>
          <tbody>
            {cycles.map((c) => (
              <tr key={c.id}>
                <td>{c.cycle_no}</td>
                <td>{c.status.replace('_', ' ')}{c.completed_by === 'accommodation' ? ' (accommodation)' : ''}</td>
                <td>{duration(Number(c.watched_seconds))} of {duration(Number(e.duration))}</td>
                <td>{dateTime(c.started_at)}</td>
                <td>{dateTime(c.viewing_completed_at)}</td>
                <td>{c.beats}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {latest?.status === 'watching' && (
        <form action={accommodationAction} className="panel form" style={{ marginTop: 16 }}>
          <input type="hidden" name="enrollmentId" value={id} />
          <b>Accessible alternative</b>
          <p className="muted small">If the student completed the lesson another way, record it here to unlock the quiz for this viewing. This is logged with your name.</p>
          <div className="field"><label htmlFor="reason">Reason</label><input id="reason" name="reason" type="text" required minLength={5} placeholder="For example: completed the lesson transcript with staff on a call" /></div>
          <div><button className="btn outline small" type="submit">Complete required viewing</button></div>
        </form>
      )}

      <h2>Quiz attempts</h2>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>When</th><th>Viewing</th><th>Attempt</th><th>Score</th><th>Result</th><th>Answers</th></tr></thead>
          <tbody>
            {attempts.length === 0 && <tr><td colSpan={6} className="muted">No attempts yet.</td></tr>}
            {attempts.map((a) => (
              <tr key={a.id}>
                <td>{dateTime(a.submitted_at)}</td>
                <td>{a.cycle_no}</td>
                <td>{a.attempt_no} of 3</td>
                <td>{a.score} / 5</td>
                <td>{a.passed ? 'Passed' : 'Not passed'}</td>
                <td className="small">
                  {content.questions.map((q, i) => {
                    const pick = (a.answers as Record<string, number>)[q.id]
                    return <div key={q.id}>Q{i + 1}: {pick === q.correctIndex ? 'correct' : 'incorrect'}</div>
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Certificates</h2>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Serial</th><th>Name printed</th><th>Issued</th><th>Status</th></tr></thead>
          <tbody>
            {certs.length === 0 && <tr><td colSpan={4} className="muted">None yet.</td></tr>}
            {certs.map((c) => (
              <tr key={c.id}><td><Link className="serial" href={`/admin/certificates/${c.id}`}>{c.serial}</Link></td><td>{c.recipient_name}</td><td>{c.issue_date}</td><td>{c.status}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {events.length > 0 && (
        <>
          <h2>Staff actions</h2>
          <ul>{events.map((ev) => <li key={ev.id}>{dateTime(ev.created_at)}: {ev.action.replace(/_/g, ' ')} by {ev.full_name}. {ev.reason}</li>)}</ul>
        </>
      )}
    </>
  )
}
