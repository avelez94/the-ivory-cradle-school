import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { isUuid } from '@/lib/api-guard'
import type { CourseContent } from '@/lib/courses'
import { LessonPlayer } from '@/components/LessonPlayer'

// Student preview of the current draft. Nothing here is saved to any student record.
export default async function CoursePreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  const [c] = await db()`select draft from courses where id = ${id}`
  if (!c) notFound()
  const d = c.draft as CourseContent
  return (
    <>
      <p className="crumbs"><Link href={`/admin/courses/${id}`}>Back to the editor</Link></p>
      <h1>Student preview: {d.title}</h1>
      <p className="notice warn" style={{ marginTop: 12 }}>Draft preview. The player behaves as it does for students during required viewing, but no progress is saved.</p>
      <div style={{ marginTop: 20, maxWidth: 900 }}>
        {d.videoFileId && d.videoDurationSeconds ? (
          <LessonPlayer
            enrollmentId={null}
            cycleId="00000000-0000-0000-0000-000000000000"
            required
            watchedSeconds={0}
            lastPosition={0}
            durationSeconds={d.videoDurationSeconds}
            videoUrl={`/api/admin/files/${d.videoFileId}`}
            captionsUrl={d.captionsFileId ? `/api/admin/files/${d.captionsFileId}` : null}
            title={d.title}
          />
        ) : (
          <p className="empty">No video in the draft yet.</p>
        )}
      </div>
      {d.worksheetFileId && (
        <p style={{ marginTop: 16 }}><a className="btn outline small" href={`/api/admin/files/${d.worksheetFileId}`} target="_blank">Open worksheet</a></p>
      )}
      <h2>Quiz as students see it</h2>
      <p className="muted small">Correct answers are marked here for staff only.</p>
      <div className="quiz" style={{ maxWidth: 900 }}>
        {d.questions.map((q, i) => (
          <fieldset className="question" key={q.id}>
            <legend><span className="qn">Question {i + 1} of 5</span>{q.prompt || <em>No question yet</em>}</legend>
            {q.options.map((o, n) => (
              <div className="option" key={n} style={n === q.correctIndex ? { borderColor: 'var(--ok)' } : undefined}>
                <span>{o}{n === q.correctIndex && <b style={{ color: 'var(--ok)' }}> (correct)</b>}</span>
              </div>
            ))}
            {q.explanation && <p className="muted small" style={{ marginTop: 10 }}>Explanation: {q.explanation}</p>}
          </fieldset>
        ))}
      </div>
    </>
  )
}
