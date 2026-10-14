import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/siteUrl'

/** When each legal page last changed: the date its "Last updated" line shows. Move both together. */
const PRIVACY_UPDATED = new Date('2026-10-13')
const TERMS_UPDATED = new Date('2026-10-09')

/**
 * The pages anyone can open. Everything else needs an account and sends a
 * visitor to sign in, so there is nothing more to list until profiles are
 * public to visitors too.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/authPage`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: PRIVACY_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: TERMS_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
