import type { Metadata } from 'next'
import { listCatalog } from '@/lib/courses'
import { CourseCards } from '@/components/CourseCards'

export const metadata: Metadata = {
  title: 'Mini Courses',
  description: 'Professional development mini courses for newborn care. Each includes a video lesson, a one page worksheet, and an untimed quiz.',
}

export default async function CatalogPage() {
  const courses = await listCatalog()
  return (
    <>
      <section className="page-head bg-parchment">
        <div className="wrap">
          <span className="label terra">Professional development</span>
          <h1 className="h-page" style={{ marginTop: 14 }}>
            Mini course catalog
          </h1>
          <p className="lede">
            Choose a skill to build. Each course includes a video lesson, a one page worksheet, and an untimed five
            question quiz. Score at least 4 out of 5 to earn a Certificate of Completion.
          </p>
        </div>
      </section>
      <section className="band tight">
        <div className="wrap">
          <CourseCards courses={courses} />
        </div>
      </section>
    </>
  )
}
