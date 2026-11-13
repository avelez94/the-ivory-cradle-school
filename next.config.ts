import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Private course media, signatures and fonts are read from disk at run time.
  // They are never placed in /public, so they are only reachable through signed in routes.
  outputFileTracingIncludes: {
    '/**': ['./private-assets/**/*', './assets/**/*', './docs/STAFF_GUIDE.md'],
  },
  serverExternalPackages: ['pdf-lib', '@pdf-lib/fontkit', 'qrcode'],
  poweredByHeader: false,
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
