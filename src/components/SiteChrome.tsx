import Link from 'next/link'
import Image from 'next/image'
import { getCurrentUser, isStaff } from '@/lib/auth'

export async function SiteHeader() {
  const user = await getCurrentUser()
  return (
    <header className="site-header">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="wrap">
        <Link href="/" className="brand" aria-label="The Ivory Cradle School home">
          <Image src="/brand/wordmark.png" alt="The Ivory Cradle School" width={664} height={231} priority />
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/newborn-care-specialist-training">NCS Training</Link>
          <Link href="/courses">Mini Courses</Link>
          <Link href="/founders">Founders</Link>
          {user && isStaff(user) && <Link href="/admin">Staff</Link>}
          {user ? (
            <Link className="btn outline" href="/dashboard">
              My dashboard
            </Link>
          ) : (
            <Link className="btn outline" href="/sign-in">
              Student sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export async function SiteFooter() {
  const user = await getCurrentUser()
  return (
    <footer className="site-footer bg-parchment">
      <div className="wrap">
        <div className="inner">
          <strong>The Ivory Cradle School</strong>
          <nav aria-label="Footer">
            <Link href="/courses">Mini Courses</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
            {user ? <Link href="/dashboard">My dashboard</Link> : <Link href="/sign-in">Student sign in</Link>}
            <Link href="/verify">Verify a Certificate</Link>
          </nav>
          <p className="note">
            Founded by Alante Velez and Justine Akinlami. Affiliated with Ivory Cradle Care and operated as a separate
            school with its own student accounts.
          </p>
        </div>
      </div>
    </footer>
  )
}
