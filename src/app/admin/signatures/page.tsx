/* eslint-disable @next/next/no-img-element */
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { dateTime } from '@/lib/format'
import { activateSignatureSetAction, uploadSignatureSetAction } from '../records-actions'

export default async function SignaturesAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin()
  const { saved, error } = await searchParams
  const sets = await db()`select s.*, u.full_name, (select count(*)::int from certificates c where c.signature_set_id = s.id) as used
    from signature_sets s left join users u on u.id = s.created_by order by s.created_at desc`
  return (
    <>
      <h1>Founder signatures</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        The active set is printed on new certificates. Certificates already issued keep the signature version they were
        issued with. Signature artwork is private and only visible to administrators.
      </p>
      {saved && <p className="notice ok" style={{ marginTop: 12 }}>Signature set updated.</p>}
      {error && <p className="notice bad" style={{ marginTop: 12 }}>Upload two PNG files under 3 MB and give the set a name.</p>}
      {sets.map((s) => (
        <div className="panel" key={s.id} style={{ marginTop: 16 }}>
          <p><b>{s.label}</b> {s.is_active && <span className="status-pill ok">Active</span>}</p>
          <p className="muted small">Added {dateTime(s.created_at)}{s.full_name ? ` by ${s.full_name}` : ''} · on {s.used} certificates</p>
          <div className="editor-grid" style={{ marginTop: 12 }}>
            <figure style={{ margin: 0 }}><img src={`/api/admin/files/${s.alante_file_id}`} alt="Alante Velez signature" style={{ background: '#F3EBDF', padding: 12, maxHeight: 120 }} /><figcaption className="small">Alante Velez, Co-Founder &amp; CEO</figcaption></figure>
            <figure style={{ margin: 0 }}><img src={`/api/admin/files/${s.justine_file_id}`} alt="Justine Akinlami signature" style={{ background: '#F3EBDF', padding: 12, maxHeight: 120 }} /><figcaption className="small">Justine Akinlami, Co-Founder &amp; CEO</figcaption></figure>
          </div>
          {!s.is_active && (
            <form action={activateSignatureSetAction} style={{ marginTop: 12 }}>
              <input type="hidden" name="setId" value={s.id} />
              <button className="btn outline small" type="submit">Make active</button>
            </form>
          )}
        </div>
      ))}
      <h2>Add a new signature set</h2>
      <form action={uploadSignatureSetAction} className="panel form" style={{ marginTop: 12 }}>
        <div className="field"><label htmlFor="sl">Name for this version</label><input id="sl" name="label" type="text" required placeholder="Founders 2027" /></div>
        <div className="editor-grid">
          <div className="field"><label htmlFor="sa">Alante Velez signature (transparent PNG)</label><input id="sa" name="alante" type="file" accept="image/png" required /></div>
          <div className="field"><label htmlFor="sj">Justine Akinlami signature (transparent PNG)</label><input id="sj" name="justine" type="file" accept="image/png" required /></div>
        </div>
        <div><button className="btn" type="submit">Upload and make active</button></div>
      </form>
    </>
  )
}
