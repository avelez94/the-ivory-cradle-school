import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Private course media, signatures and fonts are read from disk at run time.
  // They are never placed in /public, so they are only reachable through signed in routes.
  outputFileTracingIncludes: {
    // Each route bundles only what it reads, so the lesson videos are not copied into every function.
    '/api/learn/*/video': ['./private-assets/course-media/**/*.mp4'],
    '/api/learn/*/captions': ['./private-assets/course-media/**/*.vtt'],
    '/api/learn/*/worksheet': ['./private-assets/course-media/**/*.pdf'],
    // Passing the quiz issues the certificate, so it needs the fonts, brand art and signatures.
    '/api/learn/*/quiz': ['./assets/**/*', './private-assets/signatures/**/*'],
    '/api/certificates/**': ['./assets/**/*', './private-assets/signatures/**/*'],
    // Staff file previews can open any bundled file.
    '/api/admin/**': ['./private-assets/**/*', './assets/**/*'],
    // Staff pages render corrected certificates and read the staff guide.
    '/admin/**': ['./assets/**/*', './private-assets/signatures/**/*', './docs/STAFF_GUIDE.md'],
    '/sample-certificate.pdf': ['./assets/**/*', './private-assets/signatures/**/*'],
  },
  serverExternalPackages: ['pdf-lib', '@pdf-lib/fontkit', 'qrcode'],
  // Next 16 only allows quality 75 by default; photos use 90 so they stay sharp on high density screens.
  images: { qualities: [75, 90] },
  poweredByHeader: false,
  // Feeding Support on Shift was rebuilt as Milk Handling on Shift; keep shared links working.
  async redirects() {
    return [{ source: '/courses/feeding-support-on-shift', destination: '/courses/milk-handling-on-shift', permanent: true }]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      { source: '/verify', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] },
      { source: '/v/:serial', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] },
    ]
  },
}

export default nextConfig
