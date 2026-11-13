import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Student area preview' }

export default async function StudentAreaPreview() {
  const user = await getCurrentUser()
  return (
    <>
      <section className="page-head bg-peach">
        <div className="wrap">
          <span className="label terra">Preview</span>
          <h1 className="h-page" style={{ marginTop: 14 }}>
            Your courses and certificates, together.
          </h1>
          <p className="lede">
            Your student dashboard shows each course with your progress and the next step, plus every certificate you
            have earned. Below is a preview with sample details.
          </p>
          <div className="btn-row">
            {user ? (
              <Link className="btn" href="/dashboard">
                Go to my dashboard
              </Link>
            ) : (
              <>
                <Link className="btn" href="/register">
                  Create a student account
                </Link>
                <Link className="btn outline" href="/sign-in">
                  Student sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="band tight" aria-label="Sample dashboard">
        <div className="wrap">
          <div className="tabs-title">
            <h2>My Courses</h2>
            <span className="status-pill">Sample</span>
          </div>
          <div className="dash-grid">
            <div className="course-row">
              <div>
                <span className="label terra">Overnight care</span>
                <h3 className="h-card" style={{ marginTop: 8 }}>
                  The First Overnight Shift
                </h3>
                <div className="progress" role="img" aria-label="Lesson 62 percent watched">
                  <span style={{ width: '62%' }} />
                </div>
                <div className="facts">
                  <span>
                    <b>62%</b> of the lesson watched
                  </span>
                  <span>Quiz unlocks after the full lesson</span>
                  <span>Score 4 out of 5 to pass</span>
                </div>
              </div>
              <span className="btn" aria-disabled="true">
                Resume lesson
              </span>
            </div>
          </div>
          <div className="tabs-title">
            <h2>My Certificates</h2>
          </div>
          <div className="dash-grid">
            <div className="course-row">
              <div>
                <span className="label muted">Certificate of Completion</span>
                <h3 className="h-card" style={{ marginTop: 8 }}>
                  The First Overnight Shift
                </h3>
                <div className="facts">
                  <span>
                    Awarded to <b>Jordan Taylor</b>
                  </span>
                  <span>
                    Serial <b className="serial">ICS7KQ4M2XD9PRT</b>
                  </span>
                  <span>Does not expire</span>
                </div>
              </div>
              <a className="btn outline" href="/sample-certificate.pdf">
                View sample certificate
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
