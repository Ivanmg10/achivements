import { ragamesIds } from '@/constants/ragamesidpool'
import { PinnedAchievement, RecentAchievement, RetroAchievement, RetroAchievementsGameCompleted, Streak } from '@/types/types'
import { CategoryGame } from '@/hooks/useGamesByCategory'
import { GameExtraData } from '@/components/statusGameList/StatusGameList'
import { StatusSortKey, SortDir } from '@/components/status-sort-control/StatusSortControl'

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * How long ago, in the given language ("2 hours ago", "hace 2 horas"), in the
 * largest unit that fits. "—" when there is no date to tell.
 */
export function relativeTime(dateStr: string | null | undefined, lang = 'en'): string {
  if (!dateStr) return '—'
  const t = new Date(dateStr).getTime()
  if (isNaN(t)) return '—'
  const secs = Math.round((t - Date.now()) / 1000)
  const fmt = new Intl.RelativeTimeFormat(lang, { numeric: 'auto', style: 'short' })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]]
  for (const [unit, size] of units) {
    if (Math.abs(secs) >= size) return fmt.format(Math.trunc(secs / size), unit)
  }
  return fmt.format(0, 'minute')
}

export function getRandomGameIds(count: number = 5): string[] {
  const shuffled = [...ragamesIds].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export const groupByDay = (achievements: RecentAchievement[]) => {
  const last7Days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last7Days.push(d.toISOString().split('T')[0])
  }

  if (!Array.isArray(achievements)) return last7Days.map((date) => ({ date, count: 0 }))

  const grouped = achievements.reduce(
    (acc, a) => {
      const day = a.Date.split(' ')[0]
      acc[day] = (acc[day] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return last7Days.map((date) => ({ date, count: grouped[date] || 0 }))
}

export const groupByConsole = (games: RetroAchievementsGameCompleted[]) => {
  const grouped = games
    .filter((game) => game.ConsoleName !== 'Events')
    .reduce(
      (acc, game) => {
        acc[game.ConsoleName] = (acc[game.ConsoleName] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

  return Object.entries(grouped).map(([name, value]) => ({ name, value }))
}

export const groupByDays = (achievements: RecentAchievement[], totalDays: number) => {
  const days: string[] = []
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  const grouped = achievements.reduce((acc, a) => {
    const day = a.Date.split(' ')[0]
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  return days.map((date) => ({ date, count: grouped[date] || 0 }))
}


export function calcStreak(achievements: RecentAchievement[]): number {
  if (!achievements.length) return 0
  const days = new Set(achievements.map((a) => a.Date.split(' ')[0]))
  let count = 0
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    if (days.has(key)) count++
    else if (i > 0) break
  }
  return count
}


/** Only unlock dates are read, so any platform's achievements can be grouped. */
export type DatedUnlock = Pick<RetroAchievement, 'DateEarned' | 'DateEarnedHardcore'>

export function groupGameAchievementsByPeriod(
  achievements: DatedUnlock[],
  period: 'week' | 'month',
): { label: string; count: number }[] {
  const dated = achievements
    .map((a) => a.DateEarnedHardcore ?? a.DateEarned)
    .filter((d): d is string => !!d)
    .map((d) => new Date(d.replace(' ', 'T')))
    .filter((d) => !isNaN(d.getTime()))

  if (period === 'month') {
    const months = 6
    const now = new Date()
    const buckets = Array.from({ length: months }, (_, i) =>
      new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1).toISOString().slice(0, 7),
    )
    const grouped = dated.reduce((acc, d) => {
      const key = d.toISOString().slice(0, 7)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return buckets.map((label) => ({ label, count: grouped[label] || 0 }))
  }

  const weeks = 8
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const offset = weeks - 1 - i
    const end = new Date(today)
    end.setDate(end.getDate() - offset * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    return { label: start.toISOString().slice(5, 10), start: start.getTime(), end: end.getTime() + 86399999 }
  })
  return buckets.map(({ label, start, end }) => ({
    label,
    count: dated.filter((d) => d.getTime() >= start && d.getTime() <= end).length,
  }))
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
  const count = achievements.filter((a) => new Date(a.Date.replace(' ', 'T')).getTime() >= cutoff).length
  return count / days
}

export function calcAllStreaks(achievements: RecentAchievement[]): Streak[] {
  if (!achievements.length) return []
  const uniqueDays = [...new Set(achievements.map(a => a.Date.split(' ')[0]))].sort()
  const streaks: Streak[] = []
  let start = uniqueDays[0]
  let prev = uniqueDays[0]

  const makeStreak = (s: string, e: string): Streak => {
    const days = Math.round((new Date(e + 'T00:00:00').getTime() - new Date(s + 'T00:00:00').getTime()) / 86400000) + 1
    return {
      start: s,
      end: e,
      days,
      achievements: achievements.filter(a => { const d = a.Date.split(' ')[0]; return d >= s && d <= e }),
    }
  }

  for (let i = 1; i < uniqueDays.length; i++) {
    const curr = uniqueDays[i]
    const diff = Math.round((new Date(curr + 'T00:00:00').getTime() - new Date(prev + 'T00:00:00').getTime()) / 86400000)
    if (diff === 1) {
      prev = curr
    } else {
      streaks.push(makeStreak(start, prev))
      start = curr
      prev = curr
    }
  }
  streaks.push(makeStreak(start, prev))
  return streaks.sort((a, b) => b.days - a.days)
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

/** Stable identity of a pinned achievement: RA by its global id, Steam by game + apiname. */
export function pinnedKey(fav: PinnedAchievement): string {
  return fav.source === 'steam' ? `steam:${fav.game_id}:${fav.steam_apiname}` : `ra:${fav.achievement_id}`
}

/** An achievement's badge image: the full URL a Steam unlock carries, or RA's badge path. */
export function achievementBadgeUrl(a: RecentAchievement): string | undefined {
  if (a.BadgeUrl) return a.BadgeUrl
  return a.BadgeName ? `https://media.retroachievements.org/Badge/${a.BadgeName}.png` : undefined
}

/** The image of an achievement's game: the full URL a Steam unlock carries, or RA's icon path. */
export function achievementGameIconUrl(a: RecentAchievement): string | undefined {
  if (a.GameIconUrl) return a.GameIconUrl
  return a.GameIcon ? `https://retroachievements.org${a.GameIcon}` : undefined
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

export type DayBySource = { date: string; ra: number; steam: number; total: number }

/**
 * Unlocks per day over the last `days` days, ending today, split by
 * platform: RA rows have no Source, Steam rows say 'steam'. Days with none
 * are kept at zero, so a chart draws the whole stretch.
 */
export function groupByDaySource(achievements: RecentAchievement[], days = 7): DayBySource[] {
  const rows = new Map<string, DayBySource>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().split('T')[0]
    rows.set(date, { date, ra: 0, steam: 0, total: 0 })
  }
  for (const a of Array.isArray(achievements) ? achievements : []) {
    const row = rows.get(a.Date.split(' ')[0])
    if (!row) continue
    if (a.Source === 'steam') row.steam++
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

export type SpanLabels = { underMinute: string; minutes: string; hours: string; days: string; months: string }

/**
 * How long it took from the first unlock to the last, in the largest unit
 * that fits ("{n}" in each label is the count). Null with fewer than two
 * dated unlocks: there is no span to tell.
 */
export function unlockSpan(dates: (string | null | undefined)[], labels: SpanLabels): string | null {
  const times = dates.filter((d): d is string => !!d).map((d) => new Date(d).getTime()).filter((t) => !Number.isNaN(t))
  if (times.length < 2) return null
  const mins = Math.floor((Math.max(...times) - Math.min(...times)) / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 1) return labels.underMinute
  if (hours < 1) return labels.minutes.replace('{n}', String(mins))
  if (days < 1) return labels.hours.replace('{n}', String(hours))
  if (days < 30) return labels.days.replace('{n}', String(days))
  return labels.months.replace('{n}', String(Math.floor(days / 30)))
}

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
export function plural(n: number, forms: { zero?: string; one?: string; two?: string; few?: string; many?: string; other: string }, lang = 'en'): string {
  const form = forms[new Intl.PluralRules(lang).select(n)] ?? forms.other
  return form.replace('{n}', n.toLocaleString(lang))
}

/**
 * A calendar day ("2026-06-05") in the app's language, read as a local date:
 * parsed as UTC it can land on the day before west of Greenwich.
 */
export function formatDay(day: string, lang: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString(lang, options)
}

/** Every day from `start` to `end` (inclusive), as "YYYY-MM-DD", local time. */
export function daysBetween(start: string, end: string): string[] {
  const out: string[] = []
  const d = new Date(`${start}T00:00:00`)
  const last = new Date(`${end}T00:00:00`)
  while (d <= last) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    d.setDate(d.getDate() + 1)
  }
  return out
}
