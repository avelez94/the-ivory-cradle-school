import type { Metadata } from 'next'
import crypto from 'node:crypto'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getOwnEnrollmentState } from '@/lib/progress'
import { studentQuestions } from '@/lib/courses'
import { db } from '@/lib/db'
import { duration } from '@/lib/format'
import { QuizForm } from '@/components/QuizForm'
import { NameConfirm } from '@/components/NameConfirm'

export const metadata: Metadata = { title: 'Quiz', robots: { index: false } }

type Props = { params: Promise<{ enrollmentId: string }>; searchParams: Promise<{ edit?: string }> }

export default async function QuizPage({ params, searchParams }: Props) {
  const { enrollmentId } = await params
  const { edit } = await searchParams
  const user = await requireUser(`/learn/${enrollmentId}/quiz`)
  const s = await getOwnEnrollmentState(user.id, enrollmentId)
  if (!s) notFound()
  const c = s.content

  let body: React.ReactNode
  if (s.status === 'completed') {
    const [attempt] = await db()`select score from quiz_attempts where id = (select passed_attempt_id from enrollments where id = ${enrollmentId})`
    body = (
      <>
        <div className="notice ok" role="status">
          <b>You passed with {attempt?.score ?? 0} out of 5.</b> Your Certificate of Completion has been issued.
        </div>
        <div className="btn-row" style={{ marginTop: 18 }}>
          {s.certificate && (
            <a className="btn" href={`/api/certificates/${s.certificate.id}/pdf`}>
              Download certificate
            </a>
          )}
          <Link className="btn outline" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
        <p className="muted" style={{ marginTop: 24 }}>
          The lesson and worksheet stay available in your account, so you can return to them anytime.
        </p>
      </>
    )
  } else if (s.cycle.status === 'watching') {
    body = (
      <div className="panel topline" role="status">
        <span className="label terra">Quiz locked</span>
        <h2 className="h-card" style={{ marginTop: 10 }}>Finish the lesson to unlock the quiz.</h2>
        <p className="muted" style={{ marginTop: 10 }}>
          The quiz opens after you watch the full lesson{s.cycle.cycleNo > 1 ? ' again from the beginning' : ''}. You have{' '}
          {duration(s.cycle.remainingSeconds)} of the lesson left ({s.percentWatched}% watched).
        </p>
        <div className="btn-row" style={{ marginTop: 18 }}>
          <Link className="btn" href={`/learn/${enrollmentId}`}>
            {s.cycle.watchedSeconds > 0 ? 'Resume lesson' : 'Start lesson'}
          </Link>
        </div>
        <p className="muted small" style={{ marginTop: 16 }}>
          Need an accessible alternative to the video? <Link href="/contact?topic=accessibility">Contact the school</Link>.
        </p>
      </div>
    )
  } else if (s.cycle.status === 'locked') {
    body = (
      <div className="panel topline" role="status">
        <span className="label terra">Rewatch required</span>
        <h2 className="h-card" style={{ marginTop: 10 }}>Rewatch the lesson to unlock 3 new attempts.</h2>
        <p className="muted" style={{ marginTop: 10 }}>You used all three attempts for this viewing of the lesson.</p>
        <div className="btn-row" style={{ marginTop: 18 }}>
          <Link className="btn" href={`/learn/${enrollmentId}`}>
            Go to the lesson
          </Link>
        </div>
      </div>
    )
  } else if (!s.certificateNameConfirmed || edit === 'name') {
    body = <NameConfirm enrollmentId={enrollmentId} defaultName={s.certificateName || user.fullName} />
  } else {
    const key = crypto.randomUUID().replace(/-/g, '')
    body = (
      <>
        <p className="notice" style={{ marginBottom: 8 }}>
          Name on your certificate: <b>{s.certificateName}</b>.{' '}
          <Link href={`/learn/${enrollmentId}/quiz?edit=name`}>Change</Link>
        </p>
        <QuizForm
          key={key}
          enrollmentId={enrollmentId}
          submissionKey={key}
          questions={studentQuestions(c).slice(0, 5)}
          attemptsLeft={s.attemptsLeft}
        />
      </>
    )
  }

  return (
    <>
      <section className="page-head bg-parchment" style={{ paddingBottom: 32 }}>
        <div className="wrap">
          <p className="crumbs">
            <Link href="/dashboard">Dashboard</Link> / <Link href={`/learn/${enrollmentId}`}>{c.title}</Link> / Quiz
          </p>
          <h1 className="h-section">{c.title}: Quiz</h1>
          <p className="muted" style={{ marginTop: 10 }}>
            Five questions, one point each. Score 4 out of 5 to pass. No timer.
          </p>
        </div>
      </section>
      <section className="band tight">
        <div className="wrap" style={{ maxWidth: 860 }}>
          {body}
        </div>
      </section>
    </>
  )
}
