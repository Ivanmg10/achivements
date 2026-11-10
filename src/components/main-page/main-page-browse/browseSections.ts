/** The three lists the Browse section opens, in order; each is a page of its own (`/<slug>`). */
export const BROWSE_SECTIONS = [
  { slug: 'wantToPlay', emoji: '🔖' },
  { slug: 'playing', emoji: '🎮' },
  { slug: 'completed', emoji: '🏆' },
] as const

export type BrowseSlug = (typeof BROWSE_SECTIONS)[number]['slug']
