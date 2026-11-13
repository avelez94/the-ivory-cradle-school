import Image from 'next/image'
import Link from 'next/link'
import { listCatalog } from '@/lib/courses'
import { CourseCards } from '@/components/CourseCards'

export default async function HomePage() {
  const courses = await listCatalog()
  const sample = courses.find((c) => c.status === 'published')

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="wrap grid">
          <div>
            <span className="label gold">Newborn &amp; postpartum education</span>
            <h1 id="hero-title" className="h-hero">
              Learn the work of newborn care.
            </h1>
            <p className="copy">
              Prepare for your first placement or build on the work you already do. Learn with real shift scenarios,
              practical worksheets, and lessons you can take at your own pace.
            </p>
            <div className="btn-row">
              <Link className="btn" href="/courses">
                Explore courses
              </Link>
              <Link className="btn gold-outline" href={sample ? `/courses/${sample.slug}#lesson-preview` : '/courses'}>
                Try a sample lesson
              </Link>
            </div>
          </div>
          <Image
            className="photo"
            src="/images/caregiver-newborn.jpg"
            alt="A caregiver in sage green scrubs smiles at a swaddled newborn in a sunlit nursery."
            width={1536}
            height={1024}
            priority
            quality={90}
            sizes="(max-width: 760px) 100vw, 680px"
          />
        </div>
      </section>

      <section className="band bg-sand" aria-labelledby="flagship-title">
        <div className="wrap split">
          <div>
            <span className="label">Flagship program · In development</span>
            <h2 id="flagship-title" className="h-section" style={{ marginTop: 16 }}>
              Newborn Care Specialist Training
            </h2>
            <p className="lede">For students preparing to support families professionally during the newborn months.</p>
            <div className="btn-row">
              <Link className="btn" href="/newborn-care-specialist-training">
                Preview the program
              </Link>
            </div>
          </div>
          <div className="panel topline">
            <h3>What we’re developing</h3>
            <ol className="rule-list numbered">
              <li>Preparing for an in home placement</li>
              <li>Newborn care and family communication</li>
              <li>Practice scenarios and professional responsibilities</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="band bg-parchment" aria-labelledby="catalog-title">
        <div className="wrap">
          <h2 id="catalog-title" className="h-section">
            Mini course catalog
          </h2>
          <p className="lede">
            Choose a skill to build. Each course includes a video lesson, a one page worksheet, and an untimed quiz.
          </p>
          <CourseCards courses={courses} />
        </div>
      </section>

      <section className="band bg-peach" aria-labelledby="student-title">
        <div className="wrap split center">
          <div>
            <h2 id="student-title" className="h-section">
              Your courses and certificates, together.
            </h2>
            <p className="lede">
              Resume lessons in your student account. Answer four of five quiz questions correctly to earn a
              downloadable Certificate of Completion for a mini course.
            </p>
            <div className="btn-row">
              <Link className="btn" href="/student-area">
                Preview the student area
              </Link>
            </div>
          </div>
          <div>
            <div className="cert-frame">
              <Image
                src="/samples/sample-certificate.png"
                alt="Sample Certificate of Completion awarded to Jordan Taylor for The First Overnight Shift, signed by Alante Velez and Justine Akinlami."
                width={1584}
                height={1224}
                unoptimized
                sizes="(max-width: 760px) 100vw, 600px"
              />
            </div>
            <p className="center-link">
              <a href="/sample-certificate.pdf">View sample certificate (PDF)</a>
            </p>
          </div>
        </div>
      </section>

      <section className="band bg-parchment" aria-labelledby="founders-title">
        <div className="wrap split">
          <div>
            <span className="label">Your instructors</span>
            <h2 id="founders-title" className="h-section" style={{ marginTop: 16 }}>
              Alante Velez &amp; Justine Akinlami
            </h2>
          </div>
          <div>
            <p className="lede" style={{ marginTop: 0 }}>
              We began working in newborn care in 2016. As Newborn Care Specialists and Lactation Educators, we’re
              building lessons around the situations you’ll encounter in families’ homes.
            </p>
            <p style={{ marginTop: 18 }}>
              <Link className="link-arrow" href="/founders">
                About the founders <span aria-hidden="true">→</span>
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
