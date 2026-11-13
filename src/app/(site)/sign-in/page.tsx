import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { SignInForm } from '@/components/AuthForms'

export const metadata: Metadata = { title: 'Student sign in' }

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
  if (await getCurrentUser()) redirect(safe)
  return (
    <section className="band">
      <div className="wrap">
        <div className="auth-card">
          <span className="label terra">Student sign in</span>
          <h1 className="h-section" style={{ marginTop: 12 }}>
            Welcome back
          </h1>
          <p className="muted" style={{ margin: '12px 0 28px' }}>
            Sign in to resume your lessons and download your certificates.
          </p>
          <div className="panel">
            <SignInForm next={safe} />
          </div>
        </div>
      </div>
    </section>
  )
}
