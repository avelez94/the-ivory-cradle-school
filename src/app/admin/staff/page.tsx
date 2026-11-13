import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { setRoleAction } from '../records-actions'

const ERR: Record<string, string> = { missing: 'No account uses that email. Ask them to create a student account first.', self: 'You cannot remove your own administrator access.', role: 'Choose a role.' }

export default async function StaffAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin()
  const { saved, error } = await searchParams
  const staff = await db()`select full_name, email, role from users where role in ('staff', 'admin') order by role, full_name`
  return (
    <>
      <h1>Staff access</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        <b>Staff</b> can edit and publish courses and view enrollments, progress, attempts, and certificates.{' '}
        <b>Administrators</b> can also manage signatures, credential corrections, revocations and reissues, policies, and
        staff access.
      </p>
      {saved && <p className="notice ok" style={{ marginTop: 12 }}>Access updated.</p>}
      {error && <p className="notice bad" style={{ marginTop: 12 }}>{ERR[error]}</p>}
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>{staff.map((s) => <tr key={s.email}><td>{s.full_name}</td><td>{s.email}</td><td>{s.role}</td></tr>)}</tbody>
        </table>
      </div>
      <form action={setRoleAction} className="panel form" style={{ marginTop: 16 }}>
        <b>Change someone’s access</b>
        <div className="editor-grid">
          <div className="field"><label htmlFor="em">Account email</label><input id="em" name="email" type="email" required /></div>
          <div className="field"><label htmlFor="ro">Role</label><select id="ro" name="role" defaultValue="staff"><option value="staff">Staff</option><option value="admin">Administrator</option><option value="student">Student (remove staff access)</option></select></div>
        </div>
        <div><button className="btn outline small" type="submit">Save</button></div>
      </form>
    </>
  )
}
