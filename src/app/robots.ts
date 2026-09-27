import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/siteUrl'

/** Private pages redirect to sign-in on their own, so only the API needs keeping out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
