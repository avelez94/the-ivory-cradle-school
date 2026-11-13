import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getOwnEnrollmentState } from '@/lib/progress'
import { duration } from '@/lib/format'
import { LessonPlayer } from '@/components/LessonPlayer'
import { db } from '@/lib/db'
import { startRewatchAction } from './actions'

export const metadata: Metadata = { title: 'Lesson', robots: { index: false } }

type Props = { params: Promise<{ enrollmentId: string }> }

export default async function LessonPage({ params }: Props) {
  const { enrollmentId } = await params
  const user = await requireUser(`/learn/${enrollmentId}`)
  const s = await getOwnEnrollmentState(user.id, enrollmentId)
  if (!s) notFound()
  const [version] = await db()`select captions_file_id from course_versions where id = ${s.courseVersionId}`
  const c = s.content
  const locked = s.nextAction === 'rewatch_required'

  return (
    <>
      <section className="page-head bg-parchment" style={{ paddingBottom: 32 }}>
        <div className="wrap">
          <p className="crumbs">
            <Link href="/dashboard">Dashboard</Link> / {c.title}
          </p>
          <span className="label terra">{c.category}</span>
          <h1 className="h-section" style={{ marginTop: 10 }}>
            {c.title}
          </h1>
        </div>
      </section>

      <section className="band tight">
        <div className="wrap lesson-grid">
          <div>
            {locked ? (
              <div className="panel topline" role="status">
                <span className="label terra">Rewatch required</span>
                <h2 className="h-card" style={{ marginTop: 10 }}>
                  Rewatch the lesson to unlock 3 new attempts.
                </h2>
                <p className="muted" style={{ marginTop: 10 }}>
                  You used all three quiz attempts for this viewing. Watch the full lesson again from the beginning, and
                  three new attempts will unlock when you finish. Your earlier progress and scores stay on your record.
                </p>
                <form action={startRewatchAction} style={{ marginTop: 18 }}>
                  <input type="hidden" name="enrollmentId" value={s.enrollmentId} />
                  <button className="btn" type="submit">
                    Start the rewatch
                  </button>
                </form>
              </div>
            ) : (
              <LessonPlayer
                key={s.cycle.cycleId}
                enrollmentId={s.enrollmentId}
                cycleId={s.cycle.cycleId}
                required={s.cycle.status === 'watching'}
                watchedSeconds={s.cycle.watchedSeconds}
                lastPosition={s.cycle.lastPosition}
                durationSeconds={s.cycle.durationSeconds}
                videoUrl={`/api/learn/${s.enrollmentId}/video`}
                captionsUrl={version?.captions_file_id ? `/api/learn/${s.enrollmentId}/captions` : null}
                title={c.title}
              />
            )}
            <div style={{ marginTop: 28 }} className="prose">
              <h2 className="h-card" style={{ color: 'var(--espresso)' }}>
                About this lesson
              </h2>
              <p style={{ marginTop: 10 }}>{c.description}</p>
              <p className="small" style={{ marginTop: 14 }}>
                Keyboard: Space or K plays and pauses, Left and Right arrows move 10 seconds, C turns captions on or off,
                M mutes.
              </p>
            </div>
          </div>

          <aside className="side-stack" aria-label="Your progress">
            <div className="panel topline">
              <span className="label terra">Next step</span>
              {s.nextAction === 'start_lesson' && (
                <>
                  <h2 className="h-card" style={{ marginTop: 10 }}>Watch the lesson</h2>
                  <p className="muted" style={{ marginTop: 8 }}>
                    The lesson is {duration(s.cycle.durationSeconds)}. The quiz unlocks after you watch all of it.
                  </p>
                </>
              )}
              {s.nextAction === 'resume_lesson' && (
                <>
                  <h2 className="h-card" style={{ marginTop: 10 }}>Resume the lesson</h2>
                  <p className="muted" style={{ marginTop: 8 }}>
                    The quiz is locked until you finish the lesson. {duration(s.cycle.remainingSeconds)} of the lesson
                    remains ({s.percentWatched}% watched).
                  </p>
                </>
              )}
              {s.nextAction === 'take_quiz' && (
                <>
                  <h2 className="h-card" style={{ marginTop: 10 }}>Take the quiz</h2>
                  <p className="muted" style={{ marginTop: 8 }}>
                    You have {s.attemptsLeft} {s.attemptsLeft === 1 ? 'attempt' : 'attempts'} left. Five questions, no
                    timer. Score 4 out of 5 to pass.
                  </p>
                  {s.lastAttempt && !s.lastAttempt.passed && (
                    <p className="notice warn" style={{ marginTop: 12 }}>
                      Last score: {s.lastAttempt.score} out of 5.
                    </p>
                  )}
                  <Link className="btn" style={{ marginTop: 16, width: '100%' }} href={`/learn/${s.enrollmentId}/quiz`}>
                    Take quiz
                  </Link>
                </>
              )}
              {s.nextAction === 'rewatch_required' && (
                <>
                  <h2 className="h-card" style={{ marginTop: 10 }}>Rewatch required</h2>
                  <p className="muted" style={{ marginTop: 8 }}>Rewatch the lesson to unlock 3 new attempts.</p>
                </>
              )}
              {s.nextAction === 'download_certificate' && s.certificate && (
                <>
                  <h2 className="h-card" style={{ marginTop: 10 }}>Course complete</h2>
                  <p className="muted" style={{ marginTop: 8 }}>
                    Your Certificate of Completion is ready. Serial <span className="serial">{s.certificate.serial}</span>
                  </p>
                  <a className="btn" style={{ marginTop: 16, width: '100%' }} href={`/api/certificates/${s.certificate.id}/pdf`}>
                    Download certificate
                  </a>
                  <Link className="btn outline small" style={{ marginTop: 10, width: '100%' }} href={`/learn/${s.enrollmentId}/quiz`}>
                    Review your quiz
                  </Link>
                </>
              )}
            </div>

            <div className="panel">
              <span className="label muted">Worksheet</span>
              <h2 className="h-card" style={{ marginTop: 8 }}>{c.worksheetLabel}</h2>
              <p className="muted small" style={{ marginTop: 6 }}>One page PDF. Print it or fill it in on screen.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                <a className="btn small" href={`/api/learn/${s.enrollmentId}/worksheet?download=1`}>
                  Download PDF
                </a>
                <a className="btn outline small" href={`/api/learn/${s.enrollmentId}/worksheet`} target="_blank" rel="noopener">
                  Open
                </a>
              </div>
            </div>

            <div className="panel">
              <span className="label muted">Quiz</span>
              <p style={{ marginTop: 8 }}>
                {s.cycle.status === 'watching'
                  ? `Locked until you watch the full lesson. ${duration(s.cycle.remainingSeconds)} remaining.`
                  : s.status === 'completed'
                    ? 'Passed.'
                    : s.cycle.status === 'locked'
                      ? 'Locked. Rewatch the lesson to unlock 3 new attempts.'
                      : `Unlocked. ${s.attemptsLeft} of 3 attempts left.`}
              </p>
              <p className="muted small" style={{ marginTop: 12 }}>
                Need an accessible alternative to the video?{' '}
                <Link href="/contact?topic=accessibility">Contact the school</Link>.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
