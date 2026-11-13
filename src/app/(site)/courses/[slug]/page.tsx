import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { enrollmentOpen, getCourseBySlug } from '@/lib/courses'
import { getCurrentUser, isStaff } from '@/lib/auth'
import { db } from '@/lib/db'
import { enrollAction } from './actions'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const course = await getCourseBySlug(slug)
  return course ? { title: course.content.title, description: course.content.summary } : {}
}

export default async function CoursePage({ params, searchParams }: Props) {
  const { slug } = await params
  const { preview } = await searchParams
  const user = await getCurrentUser()
  const staffPreview = preview === 'draft' && isStaff(user)
  const course = await getCourseBySlug(slug, { includeDraft: staffPreview })
  if (!course) notFound()

  const c = course.content
  const gate = await enrollmentOpen(course)
  const existing = user
    ? (await db()`select id from enrollments where user_id = ${user.id} and course_id = ${course.id}`)[0]
    : null

  return (
    <>
      {staffPreview && (
        <div className="notice warn" style={{ borderRadius: 0 }}>
          <div className="wrap">Staff preview of the unpublished draft. Students see the published version.</div>
        </div>
      )}
      <section className="page-head bg-parchment">
        <div className="wrap">
          <p className="crumbs">
            <Link href="/courses">Mini courses</Link> / {c.category}
          </p>
          <span className="label terra">{c.category}</span>
          <h1 className="h-page" style={{ marginTop: 14 }}>
            {c.title}
          </h1>
          <p className="lede">{c.summary}</p>
        </div>
      </section>

      <section className="band tight">
        <div className="wrap course-layout">
          <div>
            {c.image && (
              <Image
                src={c.image}
                alt={c.imageAlt ?? ''}
                width={1672}
                height={941}
                priority
                quality={90}
                sizes="(max-width: 1000px) 100vw, 760px"
                style={{ width: '100%', height: 'auto', marginBottom: 36 }}
              />
            )}
            <h2>About this course</h2>
            <p className="prose" style={{ marginTop: 14 }}>
              {c.description}
            </p>
            {c.scope && (
              <p className="notice" style={{ marginTop: 18 }}>
                <b>Scope.</b> {c.scope}
              </p>
            )}

            <h2>Who it’s for</h2>
            <ul className="check-list">
              {c.audience.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>

            <h2>What you’ll learn</h2>
            <ul className="check-list">
              {c.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>

            <h2>What’s included</h2>
            <ul className="check-list">
              {c.included.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>

            {c.resources && c.resources.length > 0 && (
              <>
                <h2>Sources</h2>
                <ul className="check-list">
                  {c.resources.map((r) => (
                    <li key={r.url}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        {r.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h2 id="lesson-preview">How the course works</h2>
            {course.status === 'published' && (
              <figure style={{ margin: '18px 0 0' }}>
                <Image
                  src="/samples/lesson-preview.jpg"
                  alt={`A slide from the ${c.title} lesson`}
                  width={1920}
                  height={1080}
                  quality={90}
                  sizes="(max-width: 1000px) 100vw, 760px"
                  style={{ border: '1px solid var(--border)' }}
                />
                <figcaption className="muted small" style={{ marginTop: 8 }}>
                  A frame from the lesson. Enroll to watch the full lesson.
                </figcaption>
              </figure>
            )}
            <ol className="steps">
              <li>
                <div>
                  <b>Enroll and download the worksheet.</b>
                  <p className="muted">The one page {c.worksheetLabel.toLowerCase()} is available as soon as you enroll.</p>
                </div>
              </li>
              <li>
                <div>
                  <b>Watch the full lesson.</b>
                  <p className="muted">
                    Pause anytime and pick up where you left off on any device. You can replay any part you have already
                    watched.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <b>Take the five question quiz.</b>
                  <p className="muted">No timer. Review your answers before you submit. Score 4 out of 5 to pass.</p>
                </div>
              </li>
              <li>
                <div>
                  <b>Download your Certificate of Completion.</b>
                  <p className="muted">It stays in your account, with a serial number anyone can verify.</p>
                </div>
              </li>
            </ol>
          </div>

          <aside className="enroll-box panel topline" aria-label="Enrollment">
            {course.status === 'preview' ? (
              <>
                <span className="label terra">Coming soon</span>
                <h3 style={{ marginTop: 10 }}>Materials in development</h3>
                <p className="muted" style={{ marginTop: 10 }}>
                  This course is not open for enrollment yet. Start with The First Overnight Shift, or ask us to let you
                  know when it opens.
                </p>
                <div className="btn-row" style={{ marginTop: 18 }}>
                  <Link className="btn" href="/courses/the-first-overnight-shift">
                    See an open course
                  </Link>
                  <Link className="btn outline" href={`/contact?topic=${encodeURIComponent(c.title)}`}>
                    Ask about this course
                  </Link>
                </div>
              </>
            ) : (
              <>
                <span className="label terra">Mini course</span>
                <p className="price" style={{ marginTop: 10 }}>
                  {course.priceCents ? `$${(course.priceCents / 100).toFixed(0)}` : 'Free'}
                </p>
                <p className="muted small" style={{ marginTop: 4 }}>
                  About {c.estimatedMinutes ?? 15} minutes · Video, worksheet, quiz, certificate
                </p>
                <div style={{ marginTop: 20 }}>
                  {existing ? (
                    <Link className="btn" style={{ width: '100%' }} href={`/learn/${existing.id}`}>
                      Go to your lesson
                    </Link>
                  ) : gate.open && !staffPreview ? (
                    <form action={enrollAction}>
                      <input type="hidden" name="slug" value={course.slug} />
                      <button className="btn" style={{ width: '100%' }} type="submit">
                        {user ? 'Enroll now' : 'Create an account to enroll'}
                      </button>
                    </form>
                  ) : (
                    <p className="notice">
                      {gate.reason === 'database_pending'
                        ? 'Enrollment opens soon.'
                        : 'Enrollment for this course opens soon.'}
                    </p>
                  )}
                </div>
                <p className="muted small" style={{ marginTop: 14 }}>
                  {user
                    ? `Signed in as ${user.email}.`
                    : 'You do not need an Ivory Cradle Care account. Students create a separate school account.'}
                </p>
              </>
            )}
          </aside>
        </div>
      </section>
    </>
  )
}
