import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { PasswordForm, ProfileForm } from '@/components/AuthForms'

export const metadata: Metadata = { title: 'Account', robots: { index: false } }

export default async function AccountPage() {
  const user = await requireUser('/account')
  return (
    <section className="band tight">
      <div className="wrap">
        <p className="crumbs">
          <Link href="/dashboard">Dashboard</Link> / Account
        </p>
        <h1 className="h-section">Your account</h1>
        <p className="muted" style={{ marginTop: 10 }}>
          Signed in as {user.email}
        </p>
        <div className="split" style={{ marginTop: 32 }}>
          <div className="panel">
            <h2 className="h-card">Profile</h2>
            <div style={{ marginTop: 18 }}>
              <ProfileForm fullName={user.fullName} />
            </div>
          </div>
          <div className="panel">
            <h2 className="h-card">Password</h2>
            <div style={{ marginTop: 18 }}>
              <PasswordForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
