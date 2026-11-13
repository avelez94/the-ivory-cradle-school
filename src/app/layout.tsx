import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, DM_Sans, Instrument_Serif } from 'next/font/google'
import { config, isStaging } from '@/lib/config'
import './globals.css'

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-bricolage', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-dm-sans', display: 'swap' })
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic', variable: '--font-instrument', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: { default: 'The Ivory Cradle School', template: '%s · The Ivory Cradle School' },
  description:
    'Newborn and postpartum education. Practical mini courses with real shift scenarios, worksheets, and lessons you can take at your own pace.',
  // The staging site stays out of search engines until launch.
  robots: isStaging() ? { index: false, follow: false } : undefined,
  icons: { icon: '/icon.png' },
}

export const viewport: Viewport = { themeColor: '#30241F', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${dmSans.variable} ${instrument.variable}`}>
      <body>{children}</body>
    </html>
  )
}
