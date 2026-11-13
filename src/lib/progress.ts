import 'server-only'
import { db } from './db'
import { QUIZ } from './config'
import type { CourseContent } from './courses'
import { currentCycle, type CycleState } from './viewing'

export type NextAction = 'start_lesson' | 'resume_lesson' | 'take_quiz' | 'rewatch_required' | 'download_certificate'

export type EnrollmentState = {
  enrollmentId: string
  userId: string
  courseId: string
  courseSlug: string
  courseVersionId: string
  versionNo: number
  content: CourseContent
  status: 'active' | 'completed' | 'withdrawn'
  certificateName: string | null
  certificateNameConfirmed: boolean
  enrolledAt: Date
  completedAt: Date | null
  cycle: CycleState
  attemptsUsed: number
  attemptsLeft: number
  lastAttempt: { score: number; passed: boolean; attemptNo: number } | null
  certificate: { id: string; serial: string; status: string } | null
  nextAction: NextAction
  percentWatched: number
}

export async function getEnrollmentState(enrollmentId: string): Promise<EnrollmentState | null> {
  const rows = await db()`
    select e.*, c.slug, v.content, v.version_no
    from enrollments e join courses c on c.id = e.course_id join course_versions v on v.id = e.course_version_id
    where e.id = ${enrollmentId}`
  const e = rows[0]
  if (!e) return null
  const cycle = await currentCycle(enrollmentId)
  const attempts = await db()`select attempt_no, score, passed from quiz_attempts where cycle_id = ${cycle.cycleId} order by attempt_no`
  const [cert] = await db()`
    select id, serial, status from certificates
    where enrollment_id = ${enrollmentId} order by (status = 'active') desc, issued_at desc limit 1`
  const used = attempts.length
  const last = attempts[attempts.length - 1]

  let nextAction: NextAction
  if (e.status === 'completed') nextAction = 'download_certificate'
  else if (cycle.status === 'locked') nextAction = 'rewatch_required'
  else if (cycle.status === 'quiz_open') nextAction = 'take_quiz'
  else nextAction = cycle.watchedSeconds > 0 ? 'resume_lesson' : 'start_lesson'

  return {
    enrollmentId: e.id,
    userId: e.user_id,
    courseId: e.course_id,
    courseSlug: e.slug,
    courseVersionId: e.course_version_id,
    versionNo: e.version_no,
    content: e.content as CourseContent,
    status: e.status,
    certificateName: e.certificate_name,
    certificateNameConfirmed: !!e.certificate_name_confirmed_at,
    enrolledAt: e.enrolled_at,
    completedAt: e.completed_at,
    cycle,
    attemptsUsed: used,
    attemptsLeft: e.status === 'completed' ? 0 : Math.max(0, QUIZ.attemptsPerCycle - used),
    lastAttempt: last ? { score: last.score, passed: last.passed, attemptNo: last.attempt_no } : null,
    certificate: cert ? { id: cert.id, serial: cert.serial, status: cert.status } : null,
    nextAction,
    percentWatched: Math.round((cycle.watchedSeconds / cycle.durationSeconds) * 100),
  }
}

/** Loads an enrollment only if it belongs to this user. Staff use the admin views instead. */
export async function getOwnEnrollmentState(userId: string, enrollmentId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(enrollmentId)) return null
  const state = await getEnrollmentState(enrollmentId)
  if (!state || state.userId !== userId) return null
  return state
}

export async function listOwnEnrollments(userId: string) {
  const rows = await db()`select id from enrollments where user_id = ${userId} and status <> 'withdrawn' order by enrolled_at desc`
  return Promise.all(rows.map((r) => getEnrollmentState(r.id)))
}

export const NEXT_ACTION_LABEL: Record<NextAction, string> = {
  start_lesson: 'Start lesson',
  resume_lesson: 'Resume lesson',
  take_quiz: 'Take quiz',
  rewatch_required: 'Rewatch required',
  download_certificate: 'Download certificate',
}
