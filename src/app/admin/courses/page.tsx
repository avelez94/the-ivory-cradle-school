import Link from 'next/link'
import { db } from '@/lib/db'
import { dateTime } from '@/lib/format'
import { createCourseAction } from './actions'

const STATUS: Record<string, string> = { draft: 'Draft (hidden)', preview: 'Catalog preview', published: 'Published', archived: 'Archived' }

export default async function CoursesAdmin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const courses = await db()`
    select c.id, c.slug, c.status, c.draft->>'title' as title, c.updated_at, v.version_no,
      (select count(*)::int from enrollments e where e.course_id = c.id) as enrollments
    from courses c left join course_versions v on v.id = c.published_version_id
    order by c.sort_order, c.created_at`
  return (
    <>
      <h1>Courses</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        Edit a course’s draft, preview it as a student, then publish. Students who already enrolled keep the version they
        enrolled in.
      </p>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Course</th><th>Status</th><th>Live version</th><th>Enrollments</th><th>Last edited</th></tr></thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td><Link href={`/admin/courses/${c.id}`}><b>{c.title}</b></Link><br /><span className="muted small">/courses/{c.slug}</span></td>
                <td>{STATUS[c.status]}</td>
                <td>{c.version_no ? `Version ${c.version_no}` : 'None'}</td>
                <td>{c.enrollments}</td>
                <td>{dateTime(c.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>New course</h2>
      <form action={createCourseAction} className="toolbar">
        <label className="sr-only" htmlFor="new-title">Course title</label>
        <input id="new-title" name="title" type="text" placeholder="Course title" required style={{ maxWidth: 420 }} />
        <button className="btn" type="submit">Create draft</button>
      </form>
      {error && <p className="error-text" style={{ marginTop: 10 }}>{error === 'slug' ? 'A course with that address already exists.' : 'Enter a title.'}</p>}
    </>
  )
}
