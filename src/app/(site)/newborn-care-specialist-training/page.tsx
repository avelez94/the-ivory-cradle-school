import type { Metadata } from 'next'
import Link from 'next/link'
import { getSetting } from '@/lib/courses'
import { InterestForm } from './InterestForm'

export const metadata: Metadata = {
  title: 'Newborn Care Specialist Training: Coming Soon',
  description: 'The flagship Newborn Care Specialist Training program from The Ivory Cradle School is in development.',
}

export default async function FlagshipPage() {
  // Enrollment for the flagship program is configured separately and stays closed until approved.
  const enrollmentEnabled = await getSetting('flagship_enrollment_enabled', false)
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <span className="label gold">Flagship program · Coming soon</span>
          <h1 className="h-hero" style={{ maxWidth: '14ch' }}>
            Newborn Care Specialist Training
          </h1>
          <p className="copy">
            For students preparing to support families professionally during the newborn months. We are building the
            program now and will share the curriculum, schedule, and enrollment details when it is ready.
          </p>
          <div className="btn-row">
            <a className="btn" href="#notify">
              Get updates
            </a>
            <Link className="btn gold-outline" href="/courses">
              Start with a mini course
            </Link>
          </div>
        </div>
      </section>

      <section className="band bg-sand">
        <div className="wrap split">
          <div>
            <span className="label">In development</span>
            <h2 className="h-section" style={{ marginTop: 16 }}>
              What we’re developing
            </h2>
            <p className="lede">
              The program builds on the same approach as our mini courses: real situations from families’ homes,
              practical worksheets, and clear expectations.
            </p>
          </div>
          <div className="panel topline">
            <h3>Program topics</h3>
            <ol className="rule-list numbered">
              <li>Preparing for an in home placement</li>
              <li>Newborn care and family communication</li>
              <li>Practice scenarios and professional responsibilities</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="band" id="notify">
        <div className="wrap split">
          <div>
            <h2 className="h-section">Hear when enrollment opens</h2>
            <p className="lede">
              Leave your email and we will write when program details and enrollment are available. We will not use it
              for anything else.
            </p>
            {enrollmentEnabled ? null : (
              <p className="muted small" style={{ marginTop: 18 }}>
                Enrollment is not open yet.
              </p>
            )}
          </div>
          <div className="panel">
            <InterestForm />
          </div>
        </div>
      </section>
    </>
  )
}
