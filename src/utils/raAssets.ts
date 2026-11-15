/** Where RetroAchievements' pictures live. Pure, and safe in the browser (lib/raClient, which calls RA, is not). */
const SITE = 'https://retroachievements.org'
const MEDIA = 'https://media.retroachievements.org'

/** A picture RA gives as a path ("/Images/012345.png": icons, box art, screenshots). */
export function raImageUrl(path: string | null | undefined): string | undefined {
  return path ? `${SITE}${path}` : undefined
}

/** An achievement's badge, from its `BadgeName` ("123456"; "123456_lock" for the locked one). */
export function raBadgeUrl(name: string | number | null | undefined): string | undefined {
  return name ? `${MEDIA}/Badge/${name}.png` : undefined
}

/** An RA user's picture. */
export function raAvatarUrl(user: string): string {
  return `${MEDIA}/UserPic/${encodeURIComponent(user)}.png`
}
