import { SiteFooter, SiteHeader, StagingBar } from '@/components/SiteChrome'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StagingBar />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  )
}
