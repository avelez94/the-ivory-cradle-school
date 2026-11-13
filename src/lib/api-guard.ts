import 'server-only'
import { getCurrentUser, isStaff, type User } from './auth'
import { db } from './db'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type OwnedEnrollment = {
  user: User
  enrollment: { id: string; user_id: string; course_version_id: string }
  version: { video_file_id: string | null; captions_file_id: string | null; worksheet_file_id: string | null; title: string }
}

/**
 * Loads an enrollment for the signed in student who owns it. Anyone else, including another
 * student guessing an id, gets the same 404 so ids reveal nothing.
 */
export async function ownedEnrollment(enrollmentId: string): Promise<OwnedEnrollment | Response> {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'Sign in required' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  if (!UUID.test(enrollmentId)) return Response.json({ error: 'Not found' }, { status: 404 })
  const [row] = await db()`
    select e.id, e.user_id, e.course_version_id, v.video_file_id, v.captions_file_id, v.worksheet_file_id, v.title
    from enrollments e join course_versions v on v.id = e.course_version_id
    where e.id = ${enrollmentId}`
  if (!row || row.user_id !== user.id) return Response.json({ error: 'Not found' }, { status: 404 })
  return {
    user,
    enrollment: { id: row.id, user_id: row.user_id, course_version_id: row.course_version_id },
    version: { video_file_id: row.video_file_id, captions_file_id: row.captions_file_id, worksheet_file_id: row.worksheet_file_id, title: row.title },
  }
}

export async function staffOnly(): Promise<User | Response> {
  const user = await getCurrentUser()
  if (!user || !isStaff(user)) return Response.json({ error: 'Not found' }, { status: 404 })
  return user
}

export const isUuid = (s: string) => UUID.test(s)
