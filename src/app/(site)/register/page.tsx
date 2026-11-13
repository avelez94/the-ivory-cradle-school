import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { RegisterForm } from '@/components/AuthForms'

export const metadata: Metadata = { title: 'Create a student account' }

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
  if (await getCurrentUser()) redirect(safe)
  return (
    <section className="band">
      <div className="wrap">
        <div className="auth-card">
          <span className="label terra">Student account</span>
          <h1 className="h-section" style={{ marginTop: 12 }}>
            Create your account
          </h1>
          <p className="muted" style={{ margin: '12px 0 28px' }}>
            Your school account is separate from Ivory Cradle Care. Use it to enroll, track progress, and keep your
            certificates.
          </p>
          <div className="panel">
            <RegisterForm next={safe} />
          </div>
        </div>
      </div>
    </section>
  )
}
