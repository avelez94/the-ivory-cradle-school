'use client'

import { useActionState } from 'react'
import { joinInterestList, type FormState } from '../public-actions'

export function InterestForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(joinInterestList, null)
  if (state?.ok) return <p className="notice ok" role="status">{state.message}</p>
  return (
    <form action={action} className="form">
      <div className="field">
        <label htmlFor="in-name">Name (optional)</label>
        <input id="in-name" name="name" type="text" autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="in-email">Email</label>
        <input id="in-email" name="email" type="email" autoComplete="email" required />
      </div>
      {state?.error && <p className="error-text" role="alert">{state.error}</p>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Notify me'}
      </button>
    </form>
  )
}
