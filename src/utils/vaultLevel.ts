/**
 * Levels from Vault Points: reaching level L takes 60 × L^2.2 points, with no
 * cap. Early levels come fast (half a game is level 2), later ones slower.
 * Tiers name ranges of levels in words of our own, not PSN's bronze-to-platinum.
 */

export const TIERS = [
  { id: 'novice', from: 1 },
  { id: 'apprentice', from: 10 },
  { id: 'hunter', from: 20 },
  { id: 'veteran', from: 30 },
  { id: 'expert', from: 45 },
  { id: 'master', from: 60 },
  { id: 'grandmaster', from: 75 },
  { id: 'legend', from: 90 },
] as const

export type TierId = (typeof TIERS)[number]['id']

/** Points needed to reach `level` (level 1 needs none). */
export function pointsForLevel(level: number): number {
  return level <= 1 ? 0 : Math.round(60 * level ** 2.2)
}

export function levelOf(points: number): number {
  let level = Math.max(1, Math.floor((Math.max(0, points) / 60) ** (1 / 2.2)))
  // The power is a float: settle the edges on the exact thresholds.
  while (pointsForLevel(level + 1) <= points) level++
  while (level > 1 && pointsForLevel(level) > points) level--
  return level
}

export function tierOf(level: number): TierId {
  let id: TierId = TIERS[0].id
  for (const t of TIERS) if (level >= t.from) id = t.id
  return id
}

export type LevelProgress = {
  level: number
  tier: TierId
  /** Points into this level, and the points the whole level takes. */
  into: number
  span: number
  /** 0–100, towards the next level. */
  pct: number
  /** The next tier and the level it starts at; null at the last tier. */
  nextTier: { id: TierId; from: number } | null
}

export function levelProgress(points: number): LevelProgress {
  const level = levelOf(points)
  const start = pointsForLevel(level)
  const span = pointsForLevel(level + 1) - start
  const into = Math.max(0, points - start)
  const next = TIERS.find((t) => t.from > level) ?? null
  return { level, tier: tierOf(level), into, span, pct: span > 0 ? (into / span) * 100 : 0, nextTier: next ? { id: next.id, from: next.from } : null }
}

/** Monday 00:00 UTC of the week holding `date`, as YYYY-MM-DD. */
export function weekStart(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

/** The first of the month holding `date`, UTC, as YYYY-MM-DD. */
export function monthStart(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10)
}

/** The last `count` week starts (Monday, UTC, as YYYY-MM-DD), oldest first, ending with this week. */
export function lastWeeks(now: Date, count: number): string[] {
  const latest = new Date(`${weekStart(now)}T00:00:00Z`)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(latest)
    d.setUTCDate(d.getUTCDate() - 7 * (count - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}
