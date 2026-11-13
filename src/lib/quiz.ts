import 'server-only'
import { db } from './db'
import { QUIZ } from './config'
import type { CourseContent } from './courses'
import { currentCycle, NotFoundError } from './viewing'
import { certificatePdf, issueForEnrollment, type CertificateRow } from './certificates'

export type SubmitResult =
  | { status: 'graded'; score: number; passed: boolean; attemptNo: number; attemptsLeft: number; rewatchRequired: boolean; certificateId: string | null; duplicate: boolean }
  | { status: 'already_passed'; certificateId: string | null }
  | { status: 'viewing_incomplete'; remainingSeconds: number }
  | { status: 'rewatch_required' }
  | { status: 'name_required' }
  | { status: 'incomplete'; missing: string[] }

const KEY_PATTERN = /^[A-Za-z0-9_-]{16,64}$/

/**
 * Grades one submission. Safe to retry: the same submission key always returns the same
 * result, and the enrollment row lock means two devices can never use more than three
 * attempts per viewing cycle or issue more than one certificate.
 */
export async function submitQuiz(userId: string, enrollmentId: string, submissionKey: string, answers: Record<string, unknown>): Promise<SubmitResult> {
  if (!KEY_PATTERN.test(submissionKey)) throw new Error('Invalid submission key')

  let issued: CertificateRow | null = null
  const result = await db().begin(async (tx): Promise<SubmitResult> => {
    const [e] = await tx`
      select e.id, e.user_id, e.status, e.certificate_name_confirmed_at, v.content
      from enrollments e join course_versions v on v.id = e.course_version_id
      where e.id = ${enrollmentId} for update of e`
    if (!e || e.user_id !== userId) throw new NotFoundError()

    const [prior] = await tx`
      select a.attempt_no, a.score, a.passed, a.cycle_id,
        (select count(*)::int from quiz_attempts x where x.cycle_id = a.cycle_id) as used
      from quiz_attempts a where a.enrollment_id = ${enrollmentId} and a.submission_key = ${submissionKey}`
    if (prior) {
      const [cert] = await tx`select id from certificates where enrollment_id = ${enrollmentId} and replaces_id is null`
      const left = Math.max(0, QUIZ.attemptsPerCycle - prior.used)
      return {
        status: 'graded',
        score: prior.score,
        passed: prior.passed,
        attemptNo: prior.attempt_no,
        attemptsLeft: prior.passed ? 0 : left,
        rewatchRequired: !prior.passed && left === 0,
        certificateId: cert?.id ?? null,
        duplicate: true,
      }
    }

    if (e.status === 'completed') {
      const [cert] = await tx`select id from certificates where enrollment_id = ${enrollmentId} and replaces_id is null`
      return { status: 'already_passed', certificateId: cert?.id ?? null }
    }

    const cycle = await currentCycle(enrollmentId, tx)
    if (cycle.status === 'watching') return { status: 'viewing_incomplete', remainingSeconds: cycle.remainingSeconds }
    if (cycle.status === 'locked') return { status: 'rewatch_required' }
    if (!e.certificate_name_confirmed_at) return { status: 'name_required' }

    const content = e.content as CourseContent
    const questions = content.questions.slice(0, QUIZ.questionsPerAttempt)
    const clean: Record<string, number> = {}
    const missing: string[] = []
    for (const q of questions) {
      const raw = answers[q.id]
      const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw !== '' ? Number(raw) : NaN
      if (!Number.isInteger(n) || n < 0 || n >= q.options.length) missing.push(q.id)
      else clean[q.id] = n
    }
    if (missing.length) return { status: 'incomplete', missing }

    const [{ used }] = await tx`select count(*)::int as used from quiz_attempts where cycle_id = ${cycle.cycleId}`
    if (used >= QUIZ.attemptsPerCycle) {
      await tx`update viewing_cycles set status = 'locked' where id = ${cycle.cycleId}`
      return { status: 'rewatch_required' }
    }

    const score = questions.reduce((s, q) => s + (clean[q.id] === q.correctIndex ? 1 : 0), 0)
    const passed = score >= QUIZ.passScore
    const attemptNo = used + 1
    const [attempt] = await tx`
      insert into quiz_attempts (enrollment_id, cycle_id, attempt_no, submission_key, answers, score, passed)
      values (${enrollmentId}, ${cycle.cycleId}, ${attemptNo}, ${submissionKey}, ${tx.json(clean)}, ${score}, ${passed})
      returning id`

    if (passed) {
      await tx`update viewing_cycles set status = 'passed' where id = ${cycle.cycleId}`
      await tx`update enrollments set status = 'completed', completed_at = now(), passed_attempt_id = ${attempt.id} where id = ${enrollmentId}`
      issued = await issueForEnrollment(tx, enrollmentId)
    } else if (attemptNo >= QUIZ.attemptsPerCycle) {
      await tx`update viewing_cycles set status = 'locked' where id = ${cycle.cycleId}`
    }

    const attemptsLeft = passed ? 0 : QUIZ.attemptsPerCycle - attemptNo
    return {
      status: 'graded',
      score,
      passed,
      attemptNo,
      attemptsLeft,
      rewatchRequired: !passed && attemptsLeft === 0,
      certificateId: issued?.id ?? null,
      duplicate: false,
    }
  })

  if (issued) {
    try {
      await certificatePdf(issued)
    } catch (err) {
      // The record is issued; the PDF is rendered again on first download if this fails.
      console.error('certificate render failed', err)
    }
  }
  return result
}
