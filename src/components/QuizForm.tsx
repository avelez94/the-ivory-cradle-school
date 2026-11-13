'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { StudentQuestion } from '@/lib/courses'

type Result =
  | { status: 'graded'; score: number; passed: boolean; attemptsLeft: number; rewatchRequired: boolean; certificateId: string | null }
  | { status: 'already_passed'; certificateId: string | null }
  | { status: 'viewing_incomplete'; remainingSeconds: number }
  | { status: 'rewatch_required' }
  | { status: 'name_required' }
  | { status: 'incomplete'; missing: string[] }
  | { status: 'error'; message: string }

export function QuizForm(props: { enrollmentId: string; submissionKey: string; questions: StudentQuestion[]; attemptsLeft: number }) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inFlight = useRef(false)
  const answered = props.questions.filter((q) => answers[q.id] !== undefined).length

  async function submit() {
    if (inFlight.current) return // a double click sends one request; the server also dedupes by key
    inFlight.current = true
    setSubmitting(true)
    try {
      let res: Response | null = null
      for (let i = 0; i < 3; i++) {
        try {
          res = await fetch(`/api/learn/${props.enrollmentId}/quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionKey: props.submissionKey, answers }),
          })
          break
        } catch {
          await new Promise((r) => setTimeout(r, 800)) // network retry with the same key is safe
        }
      }
      const data = res ? await res.json() : { status: 'error', message: 'Could not reach the school. Check your connection and try again.' }
      setResult(res && !res.ok && !data.status ? { status: 'error', message: data.error || 'Something went wrong.' } : data)
      dialogRef.current?.close()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    let content: React.ReactNode
    if (result.status === 'graded' && result.passed) {
      content = (
        <div className="notice ok" role="status">
          <b>You scored {result.score} out of 5 and passed.</b> Your Certificate of Completion has been issued.
          <div className="btn-row" style={{ marginTop: 14 }}>
            {result.certificateId && (
              <a className="btn" href={`/api/certificates/${result.certificateId}/pdf`}>
                Download certificate
              </a>
            )}
            <button className="btn outline" type="button" onClick={() => router.refresh()}>
              Review your answers
            </button>
          </div>
        </div>
      )
    } else if (result.status === 'graded') {
      content = (
        <div className="notice warn" role="status">
          <b>You scored {result.score} out of 5.</b> A score of 4 or higher passes.{' '}
          {result.rewatchRequired ? (
            <>
              <p style={{ marginTop: 8 }}>Rewatch the lesson to unlock 3 new attempts.</p>
              <div className="btn-row" style={{ marginTop: 14 }}>
                <Link className="btn" href={`/learn/${props.enrollmentId}`}>
                  Go to the lesson
                </Link>
              </div>
            </>
          ) : (
            <>
              <p style={{ marginTop: 8 }}>
                You have {result.attemptsLeft} {result.attemptsLeft === 1 ? 'attempt' : 'attempts'} left.
              </p>
              <div className="btn-row" style={{ marginTop: 14 }}>
                <button className="btn" type="button" onClick={() => router.refresh()}>
                  Try again
                </button>
                <Link className="btn outline" href={`/learn/${props.enrollmentId}`}>
                  Review the lesson
                </Link>
              </div>
            </>
          )}
        </div>
      )
    } else if (result.status === 'already_passed') {
      content = (
        <div className="notice ok" role="status">
          You already passed this course.{' '}
          {result.certificateId && <a href={`/api/certificates/${result.certificateId}/pdf`}>Download your certificate</a>}
        </div>
      )
    } else if (result.status === 'rewatch_required') {
      content = (
        <div className="notice warn" role="status">
          Rewatch the lesson to unlock 3 new attempts. <Link href={`/learn/${props.enrollmentId}`}>Go to the lesson</Link>
        </div>
      )
    } else if (result.status === 'viewing_incomplete') {
      content = (
        <div className="notice warn" role="status">
          The quiz is locked until you finish the lesson. <Link href={`/learn/${props.enrollmentId}`}>Resume lesson</Link>
        </div>
      )
    } else if (result.status === 'incomplete') {
      content = (
        <div className="notice warn" role="alert">
          Answer every question before you submit.{' '}
          <button className="textlink" type="button" onClick={() => setResult(null)}>
            Back to the quiz
          </button>
        </div>
      )
    } else if (result.status === 'name_required') {
      content = (
        <div className="notice warn" role="alert">
          Confirm the name for your certificate first. <button className="textlink" type="button" onClick={() => router.refresh()}>Continue</button>
        </div>
      )
    } else {
      content = (
        <div className="notice bad" role="alert">
          {result.message}{' '}
          <button className="textlink" type="button" onClick={() => setResult(null)}>
            Back to the quiz
          </button>
        </div>
      )
    }
    return <div aria-live="polite">{content}</div>
  }

  return (
    <form
      className="quiz"
      onSubmit={(e) => {
        e.preventDefault()
        dialogRef.current?.showModal()
      }}
    >
      <p className="muted">
        Attempt {4 - props.attemptsLeft} of 3 for this viewing. An attempt counts only when you submit it for grading.
      </p>
      {props.questions.map((q, i) => (
        <fieldset className="question" key={q.id}>
          <legend>
            <span className="qn">Question {i + 1} of {props.questions.length}</span>
            {q.prompt}
          </legend>
          {q.options.map((opt, n) => (
            <label className="option" key={n}>
              <input
                type="radio"
                name={q.id}
                value={n}
                checked={answers[q.id] === n}
                onChange={() => setAnswers((a) => ({ ...a, [q.id]: n }))}
                required
              />
              <span>{opt}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn" type="submit" disabled={answered < props.questions.length}>
          Review answers
        </button>
        <span className="muted small">
          {answered} of {props.questions.length} answered
        </span>
      </div>

      <dialog ref={dialogRef} aria-labelledby="review-title">
        <h2 id="review-title" className="h-card">
          Review your answers
        </h2>
        <table className="review-table">
          <tbody>
            {props.questions.map((q, i) => (
              <tr key={q.id}>
                <td style={{ width: 28 }}>{i + 1}.</td>
                <td>{q.options[answers[q.id]] ?? <span className="error-text">Not answered</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small" style={{ marginTop: 14 }}>
          Submitting uses 1 of your {props.attemptsLeft} remaining {props.attemptsLeft === 1 ? 'attempt' : 'attempts'}.
        </p>
        <div className="btn-row" style={{ marginTop: 18 }}>
          <button className="btn" type="button" onClick={submit} disabled={submitting}>
            {submitting ? 'Grading…' : 'Submit for grading'}
          </button>
          <button className="btn outline" type="button" onClick={() => dialogRef.current?.close()} disabled={submitting}>
            Change answers
          </button>
        </div>
      </dialog>
    </form>
  )
}
