/** A streak's tier: from how many days it starts, its name and its hue as an RGB triplet (like the level badge's tiers, a hue for the streak only). */
export const STREAK_TIERS = [
  { from: 0, id: 'none', color: '148 152 163' },
  { from: 5, id: 'spark', color: '56 189 248' },
  { from: 10, id: 'steady', color: '52 211 153' },
  { from: 20, id: 'glow', color: '250 204 21' },
  { from: 30, id: 'blaze', color: '251 146 60' },
  { from: 40, id: 'inferno', color: '244 63 94' },
  { from: 50, id: 'legend', color: '192 132 252' },
] as const

export type StreakTier = (typeof STREAK_TIERS)[number]

/** The tier a streak of `days` is in: 0–4 days, 5–9, 10–19, 20–29, 30–39, 40–49 and 50 or more. */
export function streakTier(days: number): StreakTier {
  let tier: StreakTier = STREAK_TIERS[0]
  for (const t of STREAK_TIERS) if (days >= t.from) tier = t
  return tier
}

/** The tier's colour made readable on any theme: its hue mixed with the text colour, as the level badge does. */
export function streakInk(tier: StreakTier): string {
  return `color-mix(in oklab, rgb(${tier.color}) 72%, rgb(var(--text-main)))`
}
