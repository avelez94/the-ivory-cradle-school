import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { config } from '@/lib/config'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = { title: 'Contact the school' }

type Props = { searchParams: Promise<{ topic?: string }> }

export default async function ContactPage({ searchParams }: Props) {
  const { topic } = await searchParams
  const user = await getCurrentUser()
  const preset = topic === 'accessibility' ? 'Accessible alternative for a lesson' : topic === 'certificate' ? 'Certificate correction' : topic ? 'Course question' : ''
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <span className="label terra">Contact</span>
          <h1 className="h-page" style={{ marginTop: 14 }}>
            Contact the school
          </h1>
          <p className="lede">
            Questions about a course, a certificate, or your account. If you need an accessible alternative to a lesson
            video, tell us what would help and we will work with you.
          </p>
        </div>
      </section>
      <section className="band tight">
        <div className="wrap split">
          <div className="panel">
            <ContactForm defaultName={user?.fullName ?? ''} defaultEmail={user?.email ?? ''} defaultTopic={preset} courseHint={topic && !['accessibility', 'certificate'].includes(topic) ? topic : ''} />
          </div>
          <div className="prose">
            <h2 className="h-card" style={{ color: 'var(--espresso)' }}>
              Accessible alternatives
            </h2>
            <p style={{ marginTop: 12 }}>
              Every lesson has captions and keyboard controls. If watching the full video is a barrier for you, choose
              “Accessible alternative for a lesson” and our staff will arrange another way to complete the required
              viewing.
            </p>
            <h2 className="h-card" style={{ color: 'var(--espresso)', marginTop: 28 }}>
              Certificate corrections
            </h2>
            <p style={{ marginTop: 12 }}>
              If your printed name or course details need a correction, send us the serial number. A corrected
              certificate receives a new serial number.
            </p>
            {config.contactEmail && (
              <p style={{ marginTop: 28 }}>
                Email: <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
