import Link from 'next/link'
import type { CatalogCourse } from '@/lib/courses'

export function CourseCards({ courses }: { courses: CatalogCourse[] }) {
  return (
    <div className="cards">
      {courses.map((c, i) => (
        <article className="card" key={c.id}>
          <div className={`strip strip-${i % 3}`}>{c.content.category}</div>
          <div className="body">
            <h3 className="h-card">{c.content.title}</h3>
            <p className="desc">{c.content.summary}</p>
            {c.status === 'preview' && <span className="status-tag">Materials in development</span>}
            <div className="spacer" />
            <p className="meta">Worksheet: {c.content.worksheetLabel}</p>
            <p className="foot">
              <Link className="link-arrow" href={`/courses/${c.slug}`}>
                View course <span aria-hidden="true">→</span>
              </Link>
            </p>
          </div>
        </article>
      ))}
    </div>
  )
}
