'use client'

import { useActionState } from 'react'
import { confirmCertificateNameAction, type NameState } from '@/app/(site)/learn/[enrollmentId]/actions'

export function NameConfirm({ enrollmentId, defaultName }: { enrollmentId: string; defaultName: string }) {
  const [state, action, pending] = useActionState<NameState, FormData>(confirmCertificateNameAction, null)
  return (
    <form action={action} className="panel topline form">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <div>
        <span className="label terra">Before you start</span>
        <h2 className="h-card" style={{ marginTop: 10 }}>
          Confirm the name for your certificate
        </h2>
        <p className="muted" style={{ marginTop: 8 }}>
          If you pass, your Certificate of Completion is issued right away with this name, exactly as you type it here.
        </p>
      </div>
      <div className="field">
        <label htmlFor="cert-name">Name to print on the certificate</label>
        <input id="cert-name" name="certificateName" type="text" defaultValue={defaultName} required maxLength={80} autoComplete="name" />
      </div>
      <div className="notice">
        <b>Who can see this:</b> anyone who has your certificate’s serial number can check it on our Verify a
        Certificate page and see the name printed on it, the course title, the credential type, and its dates. Your
        email address, quiz scores, the certificate file, and your other records stay private to you and school staff.
      </div>
      <label className="check">
        <input type="checkbox" name="ack" value="yes" required />
        <span>I confirm this name is correct and understand what the verification page shows.</span>
      </label>
      {state?.error && <p className="error-text" role="alert">{state.error}</p>}
      <div>
        <button className="btn" type="submit" disabled={pending}>
          Confirm and continue to the quiz
        </button>
      </div>
    </form>
  )
}
