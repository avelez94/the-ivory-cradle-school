import { db } from '@/lib/db'
import { dateTime } from '@/lib/format'
import { markMessageHandledAction } from '../records-actions'

export default async function MessagesAdmin() {
  const messages = await db()`select * from contact_messages order by handled_at nulls first, created_at desc limit 200`
  const interest = await db()`select * from interest_signups order by created_at desc limit 500`
  return (
    <>
      <h1>Messages</h1>
      <p className="muted" style={{ marginTop: 8 }}>Contact form messages, including requests for accessible alternatives. Reply by email.</p>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Received</th><th>From</th><th>Topic</th><th>Message</th><th></th></tr></thead>
          <tbody>
            {messages.length === 0 && <tr><td colSpan={5} className="muted">No messages yet.</td></tr>}
            {messages.map((m) => (
              <tr key={m.id}>
                <td>{dateTime(m.created_at)}</td>
                <td>{m.name}<br /><a href={`mailto:${m.email}`}>{m.email}</a></td>
                <td>{m.topic}</td>
                <td style={{ whiteSpace: 'pre-wrap', maxWidth: 420 }}>{m.message}</td>
                <td>
                  {m.handled_at ? <span className="muted small">Handled {dateTime(m.handled_at)}</span> : (
                    <form action={markMessageHandledAction}><input type="hidden" name="messageId" value={m.id} /><button className="btn outline small" type="submit">Mark handled</button></form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Newborn Care Specialist Training update list</h2>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Joined</th><th>Name</th><th>Email</th></tr></thead>
          <tbody>{interest.map((i) => <tr key={i.id}><td>{dateTime(i.created_at)}</td><td>{i.name ?? ''}</td><td>{i.email}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  )
}
