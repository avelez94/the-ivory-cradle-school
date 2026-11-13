import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Frequently asked questions' }

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Do I need an Ivory Cradle Care account?',
    a: 'No. The Ivory Cradle School has its own student accounts. Create a school account with your email address to enroll.',
  },
  {
    q: 'What does a mini course include?',
    a: 'Each mini course has one video lesson with captions, a one page worksheet you can download as soon as you enroll, a five question quiz, and a Certificate of Completion when you pass.',
  },
  {
    q: 'How does the quiz work?',
    a: 'The quiz unlocks after you watch the full lesson. It has five questions worth one point each, and 4 out of 5 passes. There is no timer, and you can review and change your answers before you submit. You have three attempts for each complete viewing of the lesson. If all three attempts are used, rewatch the lesson from the beginning to unlock three new attempts.',
  },
  {
    q: 'Why can’t I skip ahead in the video?',
    a: 'The first time through, the lesson is required viewing, so it plays at normal speed and you cannot jump past the part you have not watched yet. You can always go back and replay anything you have already watched, pause, and pick up later where you left off.',
  },
  {
    q: 'Can I switch devices?',
    a: 'Yes. Your progress is saved to your student account, so you can start on a laptop and resume on your phone.',
  },
  {
    q: 'I need an accessible alternative to the video.',
    a: (
      <>
        Every lesson has captions and keyboard controls. If watching the full video is still a barrier,{' '}
        <Link href="/contact?topic=accessibility">contact the school</Link> and we will arrange another way to complete
        the required viewing.
      </>
    ),
  },
  {
    q: 'What is on my Certificate of Completion?',
    a: 'Your name as you confirm it, the course title, the completion date, a unique serial number, a QR code that links to verification, and the signatures of our founders.',
  },
  {
    q: 'Who can see my certificate details?',
    a: 'Anyone who has your full serial number can check it on the Verify a Certificate page and see the name printed on it, the course title, the credential type, and its dates. Your email address, quiz scores, and the certificate file itself stay private in your account.',
  },
  {
    q: 'How do I verify a certificate?',
    a: (
      <>
        Scan the QR code on the certificate or enter the full serial number on the{' '}
        <Link href="/verify">Verify a Certificate</Link> page. No sign in is needed.
      </>
    ),
  },
  {
    q: 'My name is wrong on my certificate.',
    a: (
      <>
        <Link href="/contact?topic=certificate">Contact us</Link> with your serial number. We will issue a corrected
        certificate with a new serial number, and the original will show as Replaced.
      </>
    ),
  },
  {
    q: 'When does Newborn Care Specialist Training open?',
    a: (
      <>
        The flagship program is in development. <Link href="/newborn-care-specialist-training">Join the update list</Link>{' '}
        to hear when details are ready.
      </>
    ),
  },
  {
    q: 'How much do mini courses cost?',
    a: 'The First Overnight Shift is $25. The price includes the video lesson, the worksheet, the quiz, and your Certificate of Completion. Each course page lists its price.',
  },
]

export default function FaqPage() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <span className="label terra">FAQ</span>
          <h1 className="h-page" style={{ marginTop: 14 }}>
            Questions, answered
          </h1>
        </div>
      </section>
      <section className="band tight">
        <div className="wrap faq" style={{ maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
          {FAQS.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
          <p className="muted" style={{ marginTop: 32 }}>
            Still have a question? <Link href="/contact">Contact the school</Link>.
          </p>
        </div>
      </section>
    </>
  )
}
