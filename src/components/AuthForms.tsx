'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import {
  registerAction, signInAction, updateProfileAction, changePasswordAction, type AuthState,
} from '@/app/(site)/auth-actions'

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, null)
  return (
    <form action={action} className="form" noValidate>
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="r-name">Full name</label>
        <input id="r-name" name="fullName" type="text" autoComplete="name" required defaultValue={state?.values?.fullName} />
        <span className="hint">You will confirm the exact name for each certificate before it is issued.</span>
      </div>
      <div className="field">
        <label htmlFor="r-email">Email</label>
        <input id="r-email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} />
      </div>
      <div className="field">
        <label htmlFor="r-password">Password</label>
        <input id="r-password" name="password" type="password" autoComplete="new-password" minLength={10} required />
        <span className="hint">At least 10 characters.</span>
      </div>
      {state?.error && <p className="error-text" role="alert">{state.error}</p>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Creating your account…' : 'Create account'}
      </button>
      <p className="muted small">
        Already have an account? <Link href={`/sign-in?next=${encodeURIComponent(next)}`}>Sign in</Link>
      </p>
    </form>
  )
}

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signInAction, null)
  return (
    <form action={action} className="form">
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="s-email">Email</label>
        <input id="s-email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} />
      </div>
      <div className="field">
        <label htmlFor="s-password">Password</label>
        <input id="s-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state?.error && <p className="error-text" role="alert">{state.error}</p>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="muted small">
        New here? <Link href={`/register?next=${encodeURIComponent(next)}`}>Create a student account</Link>
        <br />
        Forgot your password? <Link href="/contact">Contact the school</Link> and we will help you reset it.
      </p>
    </form>
  )
}

export function ProfileForm({ fullName }: { fullName: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(updateProfileAction, null)
  return (
    <form action={action} className="form">
      <div className="field">
        <label htmlFor="p-name">Full name</label>
        <input id="p-name" name="fullName" type="text" autoComplete="name" defaultValue={fullName} required />
      </div>
      {state?.error && <p className="error-text" role="alert">{state.error}</p>}
      {state?.ok && <p className="notice ok" role="status">{state.ok}</p>}
      <button className="btn" type="submit" disabled={pending}>
        Save profile
      </button>
    </form>
  )
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(changePasswordAction, null)
  return (
    <form action={action} className="form">
      <div className="field">
        <label htmlFor="pw-cur">Current password</label>
        <input id="pw-cur" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div className="field">
        <label htmlFor="pw-new">New password</label>
        <input id="pw-new" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </div>
      {state?.error && <p className="error-text" role="alert">{state.error}</p>}
      {state?.ok && <p className="notice ok" role="status">{state.ok}</p>}
      <button className="btn outline" type="submit" disabled={pending}>
        Change password
      </button>
    </form>
  )
}
