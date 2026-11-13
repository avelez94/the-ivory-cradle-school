import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaff, isAdmin } from '@/lib/auth'
import { SiteHeader } from '@/components/SiteChrome'

export const metadata: Metadata = { title: 'School administration', robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff()
  const admin = isAdmin(user)
  return (
    <>
      <SiteHeader />
      <div className="admin-shell">
        <nav className="admin-nav" aria-label="Administration">
          <span className="label">School</span>
          <Link href="/admin">Overview</Link>
          <Link href="/admin/courses">Courses</Link>
          <Link href="/admin/students">Students &amp; progress</Link>
          <Link href="/admin/certificates">Certificates</Link>
          <Link href="/admin/messages">Messages</Link>
          {admin && (
            <>
              <span className="label">Administrators</span>
              <Link href="/admin/signatures">Signatures</Link>
              <Link href="/admin/settings">Policies &amp; settings</Link>
              <Link href="/admin/staff">Staff access</Link>
            </>
          )}
          <span className="label">Help</span>
          <Link href="/admin/guide">Staff guide</Link>
        </nav>
        <main id="main" className="admin-main">
          {children}
        </main>
      </div>
    </>
  )
}
