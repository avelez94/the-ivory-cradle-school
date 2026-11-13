'use client'

import { useActionState } from 'react'
import { sendContactMessage, type FormState } from '../public-actions'

const TOPICS = ['General question', 'Accessible alternative for a lesson', 'Certificate correction', 'Course question', 'Technical problem']

export function ContactForm(props: { defaultName: string; defaultEmail: string; defaultTopic: string; courseHint: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContactMessage, null)
  if (state?.ok) return <p className="notice ok" role="status">{state.message}</p>
  return (
    <form action={action} className="form">
      <div className="field">
        <label htmlFor="c-name">Your name</label>
        <input id="c-name" name="name" type="text" autoComplete="name" defaultValue={props.defaultName} required />
      </div>
      <div className="field">
        <label htmlFor="c-email">Email</label>
        <input id="c-email" name="email" type="email" autoComplete="email" defaultValue={props.defaultEmail} required />
      </div>
      <div className="field">
        <label htmlFor="c-topic">Topic</label>
        <select id="c-topic" name="topic" defaultValue={props.defaultTopic} required>
          <option value="" disabled>
            Choose a topic
          </option>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="c-message">Message</label>
        <textarea id="c-message" name="message" required defaultValue={props.courseHint ? `About ${props.courseHint}: ` : ''} />
      </div>
      {state?.error && <p className="error-text" role="alert">{state.error}</p>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
