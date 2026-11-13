import type { MetadataRoute } from 'next'
import { config, isStaging } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  if (isStaging()) return { rules: [{ userAgent: '*', disallow: '/' }] }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/learn', '/admin', '/api', '/account'] }],
    sitemap: `${config.siteUrl}/sitemap.xml`,
  }
}
