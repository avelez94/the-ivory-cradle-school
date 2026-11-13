import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { listOwnEnrollments, NEXT_ACTION_LABEL, type EnrollmentState } from '@/lib/progress'
import { duration, longDate } from '@/lib/format'
import { signOutAction } from '../auth-actions'

export const metadata: Metadata = { title: 'My dashboard', robots: { index: false } }

function nextHref(e: EnrollmentState) {
  switch (e.nextAction) {
    case 'take_quiz':
      return `/learn/${e.enrollmentId}/quiz`
    case 'download_certificate':
      return e.certificate ? `/api/certificates/${e.certificate.id}/pdf` : `/learn/${e.enrollmentId}`
    default:
      return `/learn/${e.enrollmentId}`
  }
}

function detail(e: EnrollmentState) {
  switch (e.nextAction) {
    case 'start_lesson':
      return `Lesson is ${duration(e.cycle.durationSeconds)}. The quiz unlocks after the full lesson.`
    case 'resume_lesson':
      return `${duration(e.cycle.remainingSeconds)} of the lesson left before the quiz unlocks.`
    case 'take_quiz':
      return `Quiz unlocked. You have ${e.attemptsLeft} ${e.attemptsLeft === 1 ? 'attempt' : 'attempts'} left. Score 4 out of 5 to pass.`
    case 'rewatch_required':
      return 'Rewatch the lesson to unlock 3 new attempts.'
    case 'download_certificate':
      return 'Course complete. Your Certificate of Completion is ready.'
  }
}

export default async function DashboardPage() {
  const user = await requireUser('/dashboard')
  const enrollments = (await listOwnEnrollments(user.id)).filter(Boolean) as EnrollmentState[]
  const certs = await db()`
    select id, serial, course_title, recipient_name, issue_date, expires_on, status
    from certificates where user_id = ${user.id} order by issued_at desc`

  return (
    <>
      <section className="page-head bg-peach">
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', alignItems: 'end' }}>
          <div>
            <span className="label terra">Student dashboard</span>
            <h1 className="h-page" style={{ marginTop: 12 }}>
              Welcome, {user.fullName.split(' ')[0]}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn outline small" href="/account">
              Account
            </Link>
            <form action={signOutAction}>
              <button className="btn outline small" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="band tight">
        <div className="wrap">
          <div className="tabs-title">
            <h2 id="my-courses">My Courses</h2>
            <Link className="link-arrow" href="/courses">
              Browse courses <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="dash-grid" aria-labelledby="my-courses">
            {enrollments.length === 0 && (
              <div className="empty">
                You are not enrolled in a course yet. <Link href="/courses">Explore the mini course catalog</Link> to start.
              </div>
            )}
            {enrollments.map((e) => (
              <article className="course-row" key={e.enrollmentId}>
                <div>
                  <span className="label terra">{e.content.category}</span>
                  <h3 className="h-card" style={{ marginTop: 8 }}>
                    <Link href={`/learn/${e.enrollmentId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {e.content.title}
                    </Link>
                  </h3>
                  <div
                    className="progress"
                    role="progressbar"
                    aria-label="Lesson watched"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={e.status === 'completed' ? 100 : e.percentWatched}
                  >
                    <span style={{ width: `${e.status === 'completed' ? 100 : e.percentWatched}%` }} />
                  </div>
                  <div className="facts">
                    <span>
                      <b>{e.status === 'completed' ? 'Complete' : `${e.percentWatched}% watched`}</b>
                      {e.cycle.cycleNo > 1 && e.status !== 'completed' ? ` (viewing ${e.cycle.cycleNo})` : ''}
                    </span>
                    <span>{detail(e)}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 8, justifyItems: 'stretch' }}>
                  <a className="btn" href={nextHref(e)}>
                    {NEXT_ACTION_LABEL[e.nextAction]}
                  </a>
                  <a className="btn outline small" href={`/api/learn/${e.enrollmentId}/worksheet?download=1`}>
                    Worksheet (PDF)
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className="tabs-title">
            <h2 id="my-certs">My Certificates</h2>
            <Link className="link-arrow" href="/verify">
              Verify a Certificate <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="dash-grid" aria-labelledby="my-certs">
            {certs.length === 0 && (
              <div className="empty">Certificates you earn appear here. You can download them again anytime.</div>
            )}
            {certs.map((c) => (
              <article className="course-row" key={c.id}>
                <div>
                  <span className="label muted">Certificate of Completion</span>
                  <h3 className="h-card" style={{ marginTop: 8 }}>
                    {c.course_title}
                  </h3>
                  <div className="facts">
                    <span>
                      Awarded to <b>{c.recipient_name}</b>
                    </span>
                    <span>Issued {longDate(c.issue_date)}</span>
                    <span>{c.expires_on ? `Expires ${longDate(c.expires_on)}` : 'Does not expire'}</span>
                    <span>
                      Serial <b className="serial">{c.serial}</b>
                    </span>
                    {c.status !== 'active' && <span className="status-pill warn">{c.status === 'replaced' ? 'Replaced' : 'Revoked'}</span>}
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {c.status === 'active' && (
                    <a className="btn" href={`/api/certificates/${c.id}/pdf`}>
                      Download certificate
                    </a>
                  )}
                  <a className="btn outline small" href={`/verify?serial=${c.serial}`}>
                    Check verification
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
