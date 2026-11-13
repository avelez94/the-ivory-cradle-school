'use server'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { enrollmentOpen, getCourseBySlug } from '@/lib/courses'
import { db } from '@/lib/db'

export async function enrollAction(formData: FormData) {
  const slug = String(formData.get('slug') || '')
  const user = await getCurrentUser()
  if (!user) redirect(`/register?next=${encodeURIComponent(`/courses/${slug}`)}`)
  const course = await getCourseBySlug(slug)
  if (!course) redirect('/courses')
  const gate = await enrollmentOpen(course)
  if (!gate.open) redirect(`/courses/${slug}`)

  // One enrollment per student per course; a second click returns the existing one.
  const [row] = await db()`
    insert into enrollments (user_id, course_id, course_version_id, certificate_name)
    values (${user.id}, ${course.id}, ${course.publishedVersionId}, ${user.fullName})
    on conflict (user_id, course_id) do update set user_id = excluded.user_id
    returning id`
  await db()`insert into viewing_cycles (enrollment_id, cycle_no) values (${row.id}, 1) on conflict do nothing`
  redirect(`/learn/${row.id}`)
}
