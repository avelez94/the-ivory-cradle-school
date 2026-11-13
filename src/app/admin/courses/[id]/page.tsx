import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { config } from '@/lib/config'
import { isUuid } from '@/lib/api-guard'
import { dateTime, duration } from '@/lib/format'
import type { CourseContent } from '@/lib/courses'
import {
  publishAction, publishProblems, saveDetailsAction, saveMediaLinkAction, setDurationAction, setVisibilityAction,
  uploadCaptionsAction, uploadWorksheetAction, republishStatusAction,
} from '../actions'
import { VideoUpload } from './VideoUpload'

const SAVED: Record<string, string> = {
  '1': 'Draft saved. Students keep seeing the published version until you publish.',
  video: 'Video saved to the draft.',
  captions: 'Captions saved to the draft.',
  worksheet: 'Worksheet saved to the draft. It reaches students who enroll after you publish.',
  published: 'Published. New enrollments use this version.',
  visibility: 'Visibility updated.',
}
const ERRORS: Record<string, string> = {
  video: 'Enter an https video address and its length in seconds.',
  duration: 'Enter the video length in seconds.',
  captions: 'Upload a WebVTT caption file (.vtt) under 1 MB.',
  worksheet: 'Upload a PDF under 4 MB.',
  publish: 'This draft is not ready to publish yet. See the checklist.',
}

export default async function CourseEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { id } = await params
  const { saved, error } = await searchParams
  if (!isUuid(id)) notFound()
  const [c] = await db()`select * from courses where id = ${id}`
  if (!c) notFound()
  const d = c.draft as CourseContent
  const versions = await db()`select v.version_no, v.published_at, u.full_name from course_versions v left join users u on u.id = v.published_by where course_id = ${id} order by version_no desc`
  const files = await db()`select id, kind, storage, filename, url, created_at from files where id = any(${[d.videoFileId, d.captionsFileId, d.worksheetFileId].filter(Boolean) as string[]})`
  const f = (fid?: string | null) => files.find((x) => x.id === fid)
  const problems = await publishProblems(d)
  const qs = Array.from({ length: 5 }, (_, i) => d.questions?.[i] ?? { id: `q${i + 1}`, prompt: '', options: [], correctIndex: 0, explanation: '' })

  return (
    <>
      <p className="crumbs"><Link href="/admin/courses">Courses</Link> / {d.title}</p>
      <h1>{d.title}</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        Status: <b>{c.status}</b> · Live version: {versions[0] ? `${versions[0].version_no}, published ${dateTime(versions[0].published_at)}` : 'none'}
      </p>
      {saved && <p className="notice ok" style={{ marginTop: 16 }} role="status">{SAVED[saved] ?? 'Saved.'}</p>}
      {error && <p className="notice bad" style={{ marginTop: 16 }} role="alert">{ERRORS[error] ?? 'Something went wrong.'}</p>}

      <div className="toolbar">
        <Link className="btn outline small" href={`/courses/${c.slug}?preview=draft`} target="_blank">Preview course page</Link>
        <Link className="btn outline small" href={`/admin/courses/${id}/preview`}>Preview lesson and quiz as a student</Link>
      </div>

      <h2>Publish</h2>
      <div className="panel" style={{ marginTop: 12 }}>
        {problems.length ? (
          <>
            <p><b>Before publishing:</b></p>
            <ul style={{ margin: '8px 0 0 18px' }}>{problems.map((p) => <li key={p}>{p}</li>)}</ul>
          </>
        ) : (
          <p>The draft is complete and ready to publish.</p>
        )}
        <div className="toolbar">
          <form action={publishAction}><input type="hidden" name="courseId" value={id} /><button className="btn" type="submit" disabled={problems.length > 0}>Publish draft as version {(versions[0]?.version_no ?? 0) + 1}</button></form>
          {c.status !== 'published' && c.published_version_id && (
            <form action={republishStatusAction}><input type="hidden" name="courseId" value={id} /><button className="btn outline" type="submit">Reopen live version</button></form>
          )}
          <form action={setVisibilityAction} className="toolbar" style={{ marginTop: 0 }}>
            <input type="hidden" name="courseId" value={id} />
            <label className="sr-only" htmlFor="vis">Visibility</label>
            <select id="vis" name="status" defaultValue="" style={{ width: 'auto' }}>
              <option value="" disabled>Change visibility…</option>
              <option value="preview">Catalog preview (no enrollment)</option>
              <option value="draft">Hide from the site</option>
              <option value="archived">Archive</option>
            </select>
            <button className="btn outline small" type="submit">Apply</button>
          </form>
        </div>
      </div>

      <h2>Lesson video</h2>
      <div className="panel" style={{ marginTop: 12 }}>
        <p>
          Current: {f(d.videoFileId) ? <><b>{f(d.videoFileId)!.filename}</b> ({f(d.videoFileId)!.storage === 'bundled' ? 'staging sample' : f(d.videoFileId)!.storage === 'blob' ? 'private upload' : 'linked'}) · {d.videoDurationSeconds ? duration(d.videoDurationSeconds) : 'length not set'}</> : 'none'}
        </p>
        <div className="editor-grid" style={{ marginTop: 16 }}>
          <div>
            <h3 className="h-card" style={{ fontSize: '1.15rem' }}>Upload the HyperFrames video</h3>
            {config.blobEnabled ? (
              <VideoUpload courseId={id} />
            ) : (
              <p className="muted small" style={{ marginTop: 8 }}>Direct uploads need private Blob storage (BLOB_READ_WRITE_TOKEN). Until then, link the finished video below.</p>
            )}
          </div>
          <form action={saveMediaLinkAction} className="form">
            <h3 className="h-card" style={{ fontSize: '1.15rem' }}>Or connect a hosted video</h3>
            <input type="hidden" name="courseId" value={id} />
            <div className="field"><label htmlFor="vurl">Video file address (https, MP4)</label><input id="vurl" name="videoUrl" type="url" placeholder="https://…/lesson.mp4" /></div>
            <div className="field"><label htmlFor="vdur">Length in seconds</label><input id="vdur" name="durationSeconds" type="number" step="0.01" min="1" defaultValue={d.videoDurationSeconds ?? ''} /></div>
            <button className="btn outline small" type="submit">Connect video</button>
          </form>
        </div>
        <form action={setDurationAction} className="toolbar">
          <input type="hidden" name="courseId" value={id} />
          <label htmlFor="dur2" className="small"><b>Correct the length</b> (seconds, used for required viewing)</label>
          <input id="dur2" name="durationSeconds" type="number" step="0.01" min="1" defaultValue={d.videoDurationSeconds ?? ''} style={{ maxWidth: 140 }} />
          <button className="btn outline small" type="submit">Save length</button>
        </form>
      </div>

      <h2>Captions and worksheet</h2>
      <div className="editor-grid" style={{ marginTop: 12 }}>
        <form action={uploadCaptionsAction} className="panel form">
          <input type="hidden" name="courseId" value={id} />
          <p>Captions: {f(d.captionsFileId) ? <a href={`/api/admin/files/${d.captionsFileId}`} target="_blank">{f(d.captionsFileId)!.filename}</a> : 'none'}</p>
          <div className="field"><label htmlFor="cap">Upload WebVTT captions (.vtt)</label><input id="cap" name="captions" type="file" accept=".vtt,text/vtt" required /></div>
          <button className="btn outline small" type="submit">Upload captions</button>
        </form>
        <form action={uploadWorksheetAction} className="panel form">
          <input type="hidden" name="courseId" value={id} />
          <p>Worksheet: {f(d.worksheetFileId) ? <a href={`/api/admin/files/${d.worksheetFileId}`} target="_blank">Preview {f(d.worksheetFileId)!.filename}</a> : 'none'}</p>
          <div className="field"><label htmlFor="ws">Replace the one page worksheet (PDF)</label><input id="ws" name="worksheet" type="file" accept="application/pdf" required /><span className="hint">Students who enroll after you publish get the new worksheet.</span></div>
          <button className="btn outline small" type="submit">Upload worksheet</button>
        </form>
      </div>

      <h2>Course details and quiz</h2>
      <form action={saveDetailsAction} className="form" style={{ marginTop: 12 }}>
        <input type="hidden" name="courseId" value={id} />
        <div className="editor-grid">
          <div className="field"><label htmlFor="t">Title</label><input id="t" name="title" type="text" defaultValue={d.title} required /></div>
          <div className="field"><label htmlFor="cat">Category</label><input id="cat" name="category" type="text" defaultValue={d.category} /></div>
        </div>
        <div className="field"><label htmlFor="sum">Catalog summary (one sentence)</label><input id="sum" name="summary" type="text" defaultValue={d.summary} /></div>
        <div className="field"><label htmlFor="desc">Description</label><textarea id="desc" name="description" defaultValue={d.description} /></div>
        <div className="editor-grid">
          <div className="field"><label htmlFor="aud">Who it’s for (one per line)</label><textarea id="aud" name="audience" defaultValue={d.audience.join('\n')} /></div>
          <div className="field"><label htmlFor="obj">Learning objectives (one per line)</label><textarea id="obj" name="objectives" defaultValue={d.objectives.join('\n')} /></div>
          <div className="field"><label htmlFor="inc">What’s included (one per line)</label><textarea id="inc" name="included" defaultValue={d.included.join('\n')} /></div>
          <div>
            <div className="field"><label htmlFor="wl">Worksheet name</label><input id="wl" name="worksheetLabel" type="text" defaultValue={d.worksheetLabel} /></div>
            <div className="field" style={{ marginTop: 12 }}><label htmlFor="em">Estimated minutes</label><input id="em" name="estimatedMinutes" type="number" min="1" defaultValue={d.estimatedMinutes ?? 15} /></div>
            <div className="field" style={{ marginTop: 12 }}><label htmlFor="pr">Price in USD (for the payment phase)</label><input id="pr" name="price" type="number" min="0" step="1" defaultValue={c.price_cents ? c.price_cents / 100 : ''} /><span className="hint">Shown on the course page. Live payments are not active; staging enrollment stays free.</span></div>
            <div className="field" style={{ marginTop: 12 }}><label htmlFor="so">Catalog order</label><input id="so" name="sortOrder" type="number" defaultValue={c.sort_order} /></div>
          </div>
        </div>

        <h3 className="h-card" style={{ marginTop: 18 }}>Quiz: five questions, one point each, 4 of 5 passes</h3>
        {qs.map((q, i) => (
          <fieldset className="editor-q" key={i}>
            <legend className="label terra">Question {i + 1}</legend>
            <div className="field"><label htmlFor={`q${i}p`}>Question</label><input id={`q${i}p`} name={`q${i}_prompt`} type="text" defaultValue={q.prompt} /></div>
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className="check" style={{ marginTop: 10, alignItems: 'center' }}>
                <input type="radio" name={`q${i}_correct`} value={n} defaultChecked={q.correctIndex === n} aria-label={`Answer ${n + 1} is correct`} />
                <input type="text" name={`q${i}_opt${n}`} defaultValue={q.options[n] ?? ''} placeholder={`Answer ${n + 1}${n > 1 ? ' (optional)' : ''}`} aria-label={`Question ${i + 1} answer ${n + 1}`} />
              </div>
            ))}
            <div className="field" style={{ marginTop: 10 }}><label htmlFor={`q${i}e`}>Explanation (optional, shown after a student passes)</label><input id={`q${i}e`} name={`q${i}_expl`} type="text" defaultValue={q.explanation ?? ''} /></div>
          </fieldset>
        ))}
        <p className="muted small">Select the radio button next to the correct answer. Answer keys stay on the server and are never sent to students.</p>
        <div><button className="btn" type="submit">Save draft</button></div>
      </form>

      <h2>Version history</h2>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Version</th><th>Published</th><th>By</th></tr></thead>
          <tbody>{versions.map((v) => <tr key={v.version_no}><td>{v.version_no}</td><td>{dateTime(v.published_at)}</td><td>{v.full_name ?? 'Seed'}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  )
}
