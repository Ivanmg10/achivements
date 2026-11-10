import { PinnedAchievement, RecentAchievement, RetroAchievement, RetroAchievementsGameCompleted } from '@/types/types'
import { CategoryGame } from '@/hooks/useGamesByCategory'
import { GameExtraData } from '@/components/statusGameList/StatusGameList'
import { StatusSortKey, SortDir } from '@/components/status-sort-control/StatusSortControl'
import { localDay, parseUnlockTime, utcDay } from '@/utils/dates'
import { raBadgeUrl, raImageUrl } from '@/utils/raAssets'
import type { GameSource, GameStatus } from '@/types/game'

/** The last `totalDays` days up to `end` (today unless said otherwise), each with how many achievements fell on it. */
export const groupByDays = (achievements: RecentAchievement[], totalDays: number, end: Date = new Date()) => {
  const days: string[] = []
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    days.push(utcDay(d))
  }
  const grouped = achievements.reduce((acc, a) => {
    const day = a.Date.split(' ')[0]
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  return days.map((date) => ({ date, count: grouped[date] || 0 }))
}


/** Only the unlock date is read, so any platform's achievements can be grouped. */
export type DatedUnlock = { earnedAt: string | null }

/**
 * A game's unlocks counted per week (the last 8) or month (the last 6), in local
 * time, each bucket with its achievements and when it starts.
 */
export function groupGameAchievementsByPeriod<T extends DatedUnlock>(
  achievements: T[],
  period: 'week' | 'month',
): { label: string; start: number; count: number; items: T[] }[] {
  const dated = achievements
    .map((a) => ({ a, d: a.earnedAt ? new Date(parseUnlockTime(a.earnedAt)) : null }))
    .filter((x): x is { a: T; d: Date } => !!x.d && !isNaN(x.d.getTime()))

  const ranges =
    period === 'month'
      ? Array.from({ length: 6 }, (_, i) => {
          const now = new Date()
          const start = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
          const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
          return { label: localDay(start).slice(0, 7), start: start.getTime(), end: end.getTime() - 1 }
        })
      : Array.from({ length: 8 }, (_, i) => {
          const end = new Date()
          end.setHours(0, 0, 0, 0)
          end.setDate(end.getDate() - (7 - i) * 7)
          const start = new Date(end)
          start.setDate(start.getDate() - 6)
          return { label: localDay(start).slice(5), start: start.getTime(), end: end.getTime() + 86399999 }
        })

  return ranges.map(({ label, start, end }) => {
    const items = dated.filter(({ d }) => d.getTime() >= start && d.getTime() <= end).map(({ a }) => a)
    return { label, start, count: items.length, items }
  })
}

export function getGameSortValue(
  game: CategoryGame,
  extra: GameExtraData | undefined,
  key: StatusSortKey,
): string | number | null {
  const isWantToPlay = 'PointsTotal' in game

  switch (key) {
    case 'name':
      return game.Title
    case 'lastPlayed':
      return isWantToPlay ? null : (extra?.lastPlayed ?? null)
    case 'completed':
      // Offered on the mixed lists only, which carry the date: RA's own list has no such order.
      return null
    case 'percent':
      return isWantToPlay ? null : (parseFloat((game as RetroAchievementsGameCompleted).PctWon) || 0) * 100
    case 'points':
      if (isWantToPlay) return game.PointsTotal
      if (extra?.possibleScore == null) return null
      return extra.scoreAchievedHardcore || extra.scoreAchieved || 0
  }
}

export function compareSortValues(
  a: string | number | null,
  b: string | number | null,
  dir: SortDir,
): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  const cmp = typeof a === 'string' || typeof b === 'string'
    ? String(a).localeCompare(String(b))
    : a - b
  return dir === 'asc' ? cmp : -cmp
}

/** The month with the most points (RA), or with the most unlocks when `by` is 'ach' (Steam has no points). */
export function getBestMonth(achievements: RecentAchievement[], by: 'pts' | 'ach' = 'pts'): [string, { pts: number; ach: number }] | null {
  const byMonth: Record<string, { pts: number; ach: number }> = {}
  for (const a of achievements) {
    const key = a.Date.slice(0, 7)
    if (!byMonth[key]) byMonth[key] = { pts: 0, ach: 0 }
    byMonth[key].pts += a.Points
    byMonth[key].ach++
  }
  return Object.entries(byMonth).sort((a, b) => b[1][by] - a[1][by])[0] ?? null
}

export function calcThisMonth(achievements: RecentAchievement[]): { pts: number; ach: number } {
  const key = new Date().toISOString().slice(0, 7)
  let pts = 0, ach = 0
  for (const a of achievements) {
    if (a.Date.slice(0, 7) === key) { pts += a.Points; ach++ }
  }
  return { pts, ach }
}

export function calcAvgPerDay(achievements: RecentAchievement[], days: number = 30): number {
  if (!achievements.length) return 0
  const cutoff = Date.now() - days * 86400000
  const count = achievements.filter((a) => parseUnlockTime(a.Date) >= cutoff).length
  return count / days
}

export type ActivityKpis = { today: number; week: number; month: number; avgPerDay: number }

/**
 * Unlocks today, in the last 7 days, this calendar month and per day over the
 * last 30, from any platform. Days are UTC, as everywhere else on the site.
 */
export function activityKpis(achievements: RecentAchievement[], now: number = Date.now()): ActivityKpis {
  const todayKey = utcDay(new Date(now))
  const monthKey = todayKey.slice(0, 7)
  const weekAgo = now - 7 * 86400000
  const monthAgo = now - 30 * 86400000
  let today = 0, week = 0, month = 0, last30 = 0
  for (const a of achievements) {
    const t = parseUnlockTime(a.Date)
    if (a.Date.startsWith(todayKey)) today++
    if (a.Date.slice(0, 7) === monthKey) month++
    if (t >= weekAgo) week++
    if (t >= monthAgo) last30++
  }
  return { today, week, month, avgPerDay: last30 / 30 }
}

export function sumAchievementPoints(
  achievements: Record<string, RetroAchievement | undefined | null>,
  hardcoreOnly = false,
): { earned: number; total: number } {
  let earned = 0
  let total = 0
  for (const a of Object.values(achievements)) {
    if (!a) continue
    total += a.Points
    const isEarned = hardcoreOnly ? !!a.DateEarnedHardcore : !!(a.DateEarned || a.DateEarnedHardcore)
    if (isEarned) earned += a.Points
  }
  return { earned, total }
}

/** Stable identity of a pinned achievement: RA by its global id, Steam by game + apiname, PSN by game + trophy, Xbox by game + achievement. */
export function pinnedKey(fav: PinnedAchievement): string {
  if (fav.source === 'steam') return `steam:${fav.game_id}:${fav.steam_apiname}`
  if (fav.source === 'psn') return `psn:${fav.game_id}:${fav.psn_trophy_id}`
  if (fav.source === 'xbox') return `xbox:${fav.game_id}:${fav.xbox_achievement_id}`
  return `ra:${fav.achievement_id}`
}

/** An achievement's badge image: the full URL a Steam unlock carries, or RA's badge path. */
export function achievementBadgeUrl(a: RecentAchievement): string | undefined {
  if (a.BadgeUrl) return a.BadgeUrl
  return raBadgeUrl(a.BadgeName)
}

/** The image of an achievement's game: the full URL a Steam unlock carries, or RA's icon path. */
export function achievementGameIconUrl(a: RecentAchievement): string | undefined {
  if (a.GameIconUrl) return a.GameIconUrl
  return raImageUrl(a.GameIcon)
}

/** Completion bands, as fractions: <25%, 25–49%, 50–74%, 75–99%, 100%. */
const COMPLETION_BANDS = [0.25, 0.5, 0.75, 1] as const

/**
 * How many games fall in each completion band, for the distribution bar.
 * Takes fractions (0–1) so RA's PctWon and Steam's percentage both feed it.
 */
export function completionBuckets(fractions: number[]): number[] {
  const counts = [0, 0, 0, 0, 0]
  for (const f of fractions) {
    const i = f >= 1 ? 4 : COMPLETION_BANDS.findIndex((b) => f < b)
    counts[i < 0 ? 4 : i]++
  }
  return counts
}

/** An RGB colour, 0–255 per channel. */
export type Rgb = [number, number, number]

/**
 * The two colours that stand out in a picture, from its RGBA pixels: colours
 * are grouped coarsely, each group weighted by how many pixels it has and how
 * saturated it is (so a grey or black background does not win on size alone),
 * and the second is the strongest group clearly different from the first.
 * A one-colour picture gives that colour twice. Transparent pixels are skipped.
 */
export function dominantColors(pixels: Uint8ClampedArray): Rgb[] {
  const groups = new Map<number, { n: number; r: number; g: number; b: number; weight: number }>()
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const [r, g, b, a] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]]
    if (a < 128) continue
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    const saturation = (Math.max(r, g, b) - Math.min(r, g, b)) / 255
    const group = groups.get(key) ?? { n: 0, r: 0, g: 0, b: 0, weight: 0 }
    group.n++
    group.r += r
    group.g += g
    group.b += b
    group.weight += 0.25 + saturation
    groups.set(key, group)
  }
  const ranked = [...groups.values()]
    .sort((x, y) => y.weight - x.weight)
    .map((x): Rgb => [Math.round(x.r / x.n), Math.round(x.g / x.n), Math.round(x.b / x.n)])
  if (ranked.length === 0) return []
  const [first] = ranked
  const distance = (c: Rgb) => Math.hypot(c[0] - first[0], c[1] - first[1], c[2] - first[2])
  return [first, ranked.find((c) => distance(c) > 64) ?? first]
}

export type DayBySource = { date: string; ra: number; steam: number; psn: number; xbox: number; total: number }

/**
 * Unlocks per day over the last `days` days, ending today, split by
 * platform: RA rows have no Source, Steam and PSN rows say theirs. Days with none
 * are kept at zero, so a chart draws the whole stretch.
 */
export function groupByDaySource(achievements: RecentAchievement[], days = 7): DayBySource[] {
  const rows = new Map<string, DayBySource>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = utcDay(d)
    rows.set(date, { date, ra: 0, steam: 0, psn: 0, xbox: 0, total: 0 })
  }
  for (const a of Array.isArray(achievements) ? achievements : []) {
    const row = rows.get(a.Date.split(' ')[0])
    if (!row) continue
    if (a.Source === 'steam') row.steam++
    else if (a.Source === 'psn') row.psn++
    else if (a.Source === 'xbox') row.xbox++
    else row.ra++
    row.total++
  }
  return [...rows.values()]
}

/** Shades a heatmap draws, past the empty one. */
export const HEAT_LEVELS = 4

/**
 * How dark a heatmap day is, 0 (nothing) to HEAT_LEVELS, against the user's
 * own busiest day rather than fixed thresholds: with a best day of 165, fixed
 * steps put nearly every day in the same shade. A square-root scale keeps a
 * small day visible next to a huge one; any day with an unlock is at least 1.
 */
export function heatLevel(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0
  return Math.min(HEAT_LEVELS, Math.max(1, Math.ceil(Math.sqrt(count / max) * HEAT_LEVELS)))
}

/** The list a game is on (a page's category) as a status; anything else reads as playing. */
export const asCategory = (c?: string): GameStatus => (c === 'wantToPlay' || c === 'completed' ? c : 'playing')

/**
 * The first `limit` items of a long list, unless it is only a little longer
 * (within `slack`): cutting 61 down to 60 behind a "show all" helps no one.
 */
export function capList<T>(items: T[], limit: number, showAll: boolean, slack = 12): { visible: T[]; capped: boolean } {
  const capped = items.length > limit + slack
  return { visible: capped && !showAll ? items.slice(0, limit) : items, capped }
}

/**
 * The year in a free-form release date ("2008-03-11", "9 NOV 2015",
 * "March 2008"), or null when there is none.
 */
export function parseReleaseYear(date: string | null | undefined): number | null {
  const m = date?.match(/\b(19[5-9]\d|20\d{2})\b/)
  return m ? Number(m[1]) : null
}

/**
 * `fn` over every item, at most `limit` at a time, results in input order.
 * For calls to rate-limited services (RA, the Steam store), which a burst of
 * dozens in parallel gets turned away by.
 */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      try {
        results[i] = { status: 'fulfilled', value: await fn(items[i]) }
      } catch (reason) {
        results[i] = { status: 'rejected', reason }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/**
 * A counted noun in the right plural form for the language ("1 game",
 * "5 games", "5 игр"), with the number formatted for it too.
 */
/** A number with a fixed count of decimals, in the reader's language ("0,8" in Spanish, never "0.8"). */
export function decimal(n: number, lang = 'en', digits = 1): string {
  return n.toLocaleString(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function plural(n: number, forms: { zero?: string; one?: string; two?: string; few?: string; many?: string; other: string }, lang = 'en'): string {
  const form = forms[new Intl.PluralRules(lang).select(n)] ?? forms.other
  return form.replace('{n}', n.toLocaleString(lang))
}

/** Achievements per calendar day ("YYYY-MM-DD" → count). */
export function countByDay(achievements: RecentAchievement[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const a of achievements) {
    const d = a.Date.split(' ')[0]
    out[d] = (out[d] ?? 0) + 1
  }
  return out
}

/**
 * `text` cut where it matches `query` (first match, ignoring case), so the
 * match can be drawn apart: e.g. "Spider" in "Marvel's Spider-Man".
 */
export function matchParts(text: string, query: string): { text: string; match: boolean }[] {
  const q = query.trim()
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (at < 0) return [{ text, match: false }]
  return [
    { text: text.slice(0, at), match: false },
    { text: text.slice(at, at + q.length), match: true },
    { text: text.slice(at + q.length), match: false },
  ].filter((p) => p.text !== '')
}

/**
 * The top of a day-by-day strip: the 90th percentile of the days with something,
 * so one huge day does not flatten the rest (days above it are cut and say their
 * figure). At least 1.
 */
export function stripCap(counts: number[]): number {
  const busy = counts.filter((n) => n > 0).sort((a, b) => a - b)
  if (!busy.length) return 1
  return Math.max(1, busy[Math.floor((busy.length - 1) * 0.9)])
}

/**
 * The year at a glance, for the streak page: days with any achievement, the
 * average streak, days since the last achievement (0 = today), the longest
 * run of days without one, and achievements per weekday (Monday first).
 */
export function streakInsights(byDay: Record<string, number>, streaks: { days: number }[], today: string) {
  const active = Object.keys(byDay).filter((d) => byDay[d] > 0).sort()
  const dayMs = 86400000
  const diff = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / dayMs)
  let longestGap = 0
  for (let i = 1; i < active.length; i++) longestGap = Math.max(longestGap, diff(active[i - 1], active[i]) - 1)
  const weekdays = [0, 0, 0, 0, 0, 0, 0]
  for (const d of active) weekdays[(new Date(`${d}T00:00:00`).getDay() + 6) % 7] += byDay[d]
  return {
    activeDays: active.length,
    avgStreak: streaks.length ? streaks.reduce((s, x) => s + x.days, 0) / streaks.length : 0,
    daysSinceLast: active.length ? Math.max(0, diff(active[active.length - 1], today)) : null,
    longestGap,
    weekdays,
  }
}

const GAME_ROUTES: Record<string, GameSource> = { psnGame: 'psn', steamGame: 'steam', xboxGame: 'xbox' }

/** The platform of a game page's URL (/psnGame/…, /steamGame/…, /xboxGame/…), or null for any other page. */
export function gameSourceFromPath(pathname: string | null): GameSource | null {
  return GAME_ROUTES[pathname?.split('/')[1] ?? ''] ?? null
}
