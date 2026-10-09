/**
 * The public origin, for canonical links, the sitemap and absolute OG image
 * URLs. Same variable the reset links are built from, so one setting in
 * Vercel covers both.
 */
export const SITE_URL = (process.env.NEXTAUTH_URL?.trim() || 'http://localhost:3000').replace(/\/$/, '')

export const SITE_NAME = 'CheevoVault'

/** Who is responsible for the personal data the site keeps (the GDPR's "controller"). */
export const DATA_CONTROLLER = 'Iván Márquez García'

/** Where people write to exercise their data rights; the privacy page shows it when set. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? ''

/**
 * The title search results and link previews show. The name alone is no use
 * while nobody is searching for the name: what people type is what the site
 * does, and the two platforms it does it for.
 */
export const SITE_TITLE = 'CheevoVault · RetroAchievements & Steam achievement tracker'

export const SITE_DESCRIPTION =
  'Track your RetroAchievements, Steam and PlayStation achievements in one place: completion, streaks, rarest unlocks and what is left to hunt.'

/** NEXTAUTH_URL's origin, or null when unset or unparseable. */
export function configuredOrigin(): string | null {
  const raw = process.env.NEXTAUTH_URL?.trim()
  if (!raw) return null
  try {
    return new URL(raw).origin
  } catch {
    return null
  }
}

/** Hosts Vercel itself assigns to this deployment: its own URL, its branch alias, production. */
const VERCEL_HOST_VARS = ['VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL'] as const

/**
 * The origin to build absolute links to this site from (the admin panel link
 * in the NPSSO reminder, say): the one the request came in on, when it is one
 * of this project's own (NEXTAUTH_URL, or a host Vercel assigned), otherwise
 * NEXTAUTH_URL. A Host header that is not on the list is never used, so a
 * client cannot aim a link elsewhere.
 */
export function siteOrigin(requestUrl: string): string | null {
  const configured = configuredOrigin()
  let origin: string
  try {
    origin = new URL(requestUrl).origin
  } catch {
    return configured
  }
  const trusted = new Set<string>(configured ? [configured] : [])
  for (const name of VERCEL_HOST_VARS) {
    const host = process.env[name]?.trim()
    if (host) trusted.add(`https://${host}`)
  }
  return trusted.has(origin) ? origin : configured
}
