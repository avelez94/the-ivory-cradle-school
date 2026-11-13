import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getSetting } from '@/lib/courses'
import { savePolicyAction, saveSettingsAction } from '../records-actions'

export default async function SettingsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin()
  const { saved, error } = await searchParams
  const policies = await db()`select * from credential_policies order by credential_type`
  const staging = await getSetting('staging_enrollment_enabled', true)
  const payments = await getSetting('payments_enabled', false)
  const flagship = await getSetting('flagship_enrollment_enabled', false)
  return (
    <>
      <h1>Policies &amp; settings</h1>
      {saved && <p className="notice ok" style={{ marginTop: 12 }}>Saved.</p>}
      {error && <p className="notice bad" style={{ marginTop: 12 }}>Check the policy fields. Months must be a positive number, or blank for no expiration.</p>}

      <h2>Expiration by credential type</h2>
      <p className="muted small">Applied when a credential is issued and saved with it. Changing a policy never changes credentials already issued.</p>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Credential type</th><th>Label</th><th>Valid for</th></tr></thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.credential_type}><td>{p.credential_type}</td><td>{p.label}</td><td>{p.validity_months ? `${p.validity_months} months` : 'Does not expire'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={savePolicyAction} className="panel form" style={{ marginTop: 16 }}>
        <b>Add or update a policy</b>
        <div className="editor-grid">
          <div className="field"><label htmlFor="ct">Credential type key</label><input id="ct" name="credentialType" type="text" required placeholder="certificate_of_completion" /></div>
          <div className="field"><label htmlFor="cl">Label shown on verification</label><input id="cl" name="label" type="text" required placeholder="Certificate of Completion" /></div>
          <div className="field"><label htmlFor="cm">Valid for (months, blank for no expiration)</label><input id="cm" name="validityMonths" type="number" min="1" /></div>
        </div>
        <div><button className="btn outline small" type="submit">Save policy</button></div>
      </form>

      <h2>Enrollment and payments</h2>
      <form action={saveSettingsAction} className="panel form" style={{ marginTop: 12 }}>
        <label className="check"><input type="checkbox" name="staging_enrollment_enabled" defaultChecked={staging} /><span><b>Staging enrollment</b>: students can enroll without paying, for testing.</span></label>
        <label className="check"><input type="checkbox" name="payments_enabled" defaultChecked={payments} /><span><b>Payments</b>: reserved for the payment phase. Checkout is not built yet, so leave this off.</span></label>
        <label className="check"><input type="checkbox" name="flagship_enrollment_enabled" defaultChecked={flagship} /><span><b>Flagship enrollment</b>: reserved for Newborn Care Specialist Training. Keep off until the program is approved.</span></label>
        <div><button className="btn outline small" type="submit">Save settings</button></div>
      </form>
    </>
  )
}
