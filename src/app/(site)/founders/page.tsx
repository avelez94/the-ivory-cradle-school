import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'About the Founders' }

export default function FoundersPage() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <span className="label terra">Your instructors</span>
          <h1 className="h-page" style={{ marginTop: 14 }}>
            Alante Velez &amp; Justine Akinlami
          </h1>
          <p className="lede">
            We began working in newborn care in 2016. As Newborn Care Specialists and Lactation Educators, we’re
            building lessons around the situations you’ll encounter in families’ homes.
          </p>
        </div>
      </section>

      <section className="band tight">
        <div className="wrap split">
          <article className="panel topline">
            <span className="label terra">Co-Founder &amp; CEO</span>
            <h2 className="h-card" style={{ marginTop: 10, fontSize: '2rem' }}>
              Alante Velez
            </h2>
            <p className="muted" style={{ marginTop: 12 }}>
              Newborn Care Specialist and Lactation Educator, working with newborns and their families since 2016.
            </p>
          </article>
          <article className="panel topline">
            <span className="label terra">Co-Founder &amp; CEO</span>
            <h2 className="h-card" style={{ marginTop: 10, fontSize: '2rem' }}>
              Justine Akinlami
            </h2>
            <p className="muted" style={{ marginTop: 12 }}>
              Newborn Care Specialist and Lactation Educator, working with newborns and their families since 2016.
            </p>
          </article>
        </div>
      </section>

      <section className="band bg-sand">
        <div className="wrap split">
          <div>
            <h2 className="h-section">Why we started a school</h2>
          </div>
          <div className="prose" style={{ fontSize: '1.08rem' }}>
            <p>
              The first nights with a new family ask a lot of a caregiver: clear communication, steady routines, and good
              judgment when something feels off. Those skills are learned on the job, often without much guidance.
            </p>
            <p>
              The Ivory Cradle School turns those lessons into short, practical courses. Each one centers on a real moment
              from a shift and gives you a worksheet you can bring with you.
            </p>
            <p>
              The school is affiliated with Ivory Cradle Care and runs as its own business, with separate student
              accounts.
            </p>
            <p style={{ marginTop: 22 }}>
              <Link className="btn" href="/courses">
                Explore courses
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
