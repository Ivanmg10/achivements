/**
 * The public origin, for canonical links, the sitemap and absolute OG image
 * URLs. Same variable the reset links are built from, so one setting in
 * Vercel covers both.
 */
export const SITE_URL = (process.env.NEXTAUTH_URL?.trim() || 'http://localhost:3000').replace(/\/$/, '')

export const SITE_NAME = 'CheevoVault'

export const SITE_DESCRIPTION =
  'Track your RetroAchievements and Steam achievements in one place: completion, streaks, rarest unlocks and what is left to hunt.'
