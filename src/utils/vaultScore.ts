/**
 * Vault Points (PV): one score worth the same on every platform. A game is a
 * bag of 1000 points wherever it is played; what decides how much of it an
 * achievement is worth is its rarity inside its own game, and how hard the game
 * is to finish. Native values (RA points, gamerscore, PSN grade) weigh a
 * quarter. The reasoning and the balance tests are in docs/rankings-plan.md.
 *
 * Bump RULES_VERSION whenever a number here changes: stored scores carry it,
 * and the refresh recomputes every game scored under another one.
 */
export const RULES_VERSION = 1

/** One achievement as the score sees it, whatever the platform. */
export type ScoreAchievement = {
  /** The platform's own value: RA points, gamerscore, PSN grade points; 1 on Steam. */
  native: number
  /** Share of players who have it, 0–100; null when the platform does not say. */
  rarity: number | null
  earned: boolean
  /** When it was earned (ISO); null when not earned or the platform gives no date. */
  earnedAt: string | null
  /** An RA softcore unlock: half the value, and the game does not count as completed. */
  softcore?: boolean
}

/** [unix seconds, points] per earned achievement; 0 seconds when the date is unknown. */
export type ScoreUnlock = [number, number]

export type GameScore = {
  points: number
  earned: number
  total: number
  completed: boolean
  unlocks: ScoreUnlock[]
}

const BASE = 1000
const NATIVE_SHARE = 0.25
const RARITY_FLOOR = 0.001
const COMPLETION_BONUS = 0.2
const SOFTCORE = 0.5
/** Below this many achievements a game has no reliable "most common" one. */
const MIN_FOR_RELATIVE = 5
/** Without rarity: roughly the median multipliers, so a game neither gains nor loses. */
const MISSING_RARITY = 1.5
const MISSING_DIFFICULTY = 0.7
/** RA only: below this many players, rarity is pulled towards a typical value. */
const FEW_PLAYERS = 50
const SHRINK_WEIGHT = 20
const SHRINK_TOWARDS = 20
const DAY = 86_400

const clamp01 = (x: number) => Math.min(1, Math.max(RARITY_FLOOR, x))
const seconds = (iso: string | null) => {
  const t = iso ? Date.parse(iso) : NaN
  return Number.isFinite(t) ? Math.floor(t / 1000) : 0
}

/** RA's rarity with few players is noise (1 of 3 is "33 %"): pull it towards a typical value. */
export function shrinkRarity(rarity: number, players: number): number {
  if (players >= FEW_PLAYERS) return rarity
  return (rarity * players + SHRINK_TOWARDS * SHRINK_WEIGHT) / (players + SHRINK_WEIGHT)
}

/** ×1 for what everyone who plays has, ×2 ten times rarer, up to ×4 at 0.1 %. */
export function rarityMultiplier(relative: number): number {
  return 1 + Math.log10(1 / clamp01(relative))
}

/** ×0.4 when nearly everyone reaches the hardest achievement, ×1 when 10 % or fewer do. */
export function difficultyMultiplier(rarestRelative: number): number {
  return 0.4 + 0.6 * Math.min(1, Math.log10(1 / clamp01(rarestRelative)))
}

/**
 * A game's points from its whole list (earned and not), and when each was
 * earned. `players` (RA) softens rarities measured on very few people.
 */
export function scoreGame(list: ScoreAchievement[], players?: number): GameScore {
  const total = list.length
  const earnedList = list.filter((a) => a.earned)
  if (total === 0 || earnedList.length === 0) return { points: 0, earned: earnedList.length, total, completed: false, unlocks: [] }

  const rarities = list.map((a) => (a.rarity === null || a.rarity <= 0 ? null : players !== undefined ? shrinkRarity(a.rarity, players) : a.rarity))
  const known = rarities.filter((r): r is number => r !== null)
  const nativeSum = list.reduce((s, a) => s + Math.max(0, a.native), 0)
  const relative = total >= MIN_FOR_RELATIVE && known.length > 0
  const rMax = known.length ? Math.max(...known) : 100
  const rel = (r: number) => (relative ? r / rMax : r / 100)

  // No rarity at all: the native values are all there is to go on.
  const nativeShare = known.length === 0 ? 1 : NATIVE_SHARE
  const difficulty = known.length ? difficultyMultiplier(rel(Math.min(...known))) : MISSING_DIFFICULTY

  const unlocks: ScoreUnlock[] = []
  let sum = 0
  list.forEach((a, i) => {
    if (!a.earned) return
    const weight = (1 - nativeShare) / total + nativeShare * (nativeSum > 0 ? Math.max(0, a.native) / nativeSum : 1 / total)
    const r = rarities[i]
    const value = BASE * weight * (r === null ? MISSING_RARITY : rarityMultiplier(rel(r))) * difficulty * (a.softcore ? SOFTCORE : 1)
    sum += value
    unlocks.push([seconds(a.earnedAt), value])
  })

  const completed = earnedList.length === total && earnedList.every((a) => !a.softcore)
  if (completed) {
    // The bonus belongs to the day the game was finished: its last unlock.
    unlocks.push([Math.max(...unlocks.map(([t]) => t)), sum * COMPLETION_BONUS])
  }
  // Weeks and months need no finer grain than a day, and a game with thousands of achievements stays small.
  const byDay = new Map<number, number>()
  for (const [t, p] of unlocks) {
    const day = t > 0 ? t - (t % DAY) : 0
    byDay.set(day, (byDay.get(day) ?? 0) + p)
  }
  const rounded = [...byDay].sort((a, b) => a[0] - b[0]).map(([t, p]): ScoreUnlock => [t, Math.round(p)])
  return { points: rounded.reduce((s, [, p]) => s + p, 0), earned: earnedList.length, total, completed, unlocks: rounded }
}

/**
 * A stand-in until the game's achievements are read: its progress from the
 * library list (`share` of the native value, 0–1) at the median multipliers.
 * Its date is unknown, so it counts for all time and in no week or month.
 */
export function provisionalScore(share: number, earned: number, total: number, completed: boolean): GameScore {
  if (earned <= 0 || share <= 0) return { points: 0, earned: Math.max(0, earned), total, completed: false, unlocks: [] }
  const points = Math.round(BASE * Math.min(1, share) * MISSING_RARITY * MISSING_DIFFICULTY * (completed ? 1 + COMPLETION_BONUS : 1))
  return { points, earned, total, completed, unlocks: [[0, points]] }
}

/**
 * Steam unlock tools leave their mark: most of a game's achievements on the
 * very same second. Ten or more earned, nine in ten sharing one second.
 */
export function looksUnlockedByTool(list: ScoreAchievement[]): boolean {
  const times = list.filter((a) => a.earned).map((a) => seconds(a.earnedAt)).filter((t) => t > 0)
  if (times.length < 10) return false
  const counts = new Map<number, number>()
  for (const t of times) counts.set(t, (counts.get(t) ?? 0) + 1)
  return Math.max(...counts.values()) / times.length >= 0.9
}

/** The same game listed again on one platform (regions, PS4/PS5, Vita): one title, whatever the suffixes. */
export function stackKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/[([][^)\]]*[)\]]/g, ' ')
    .replace(/\b(ps3|ps4|ps5|ps vita|vita|trophies|trophy set)\b/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** First copy whole, the second half, the rest a tenth; the best-scoring copy counts as the first. */
export function stackFactors(games: { key: string; points: number }[]): number[] {
  const order = games.map((g, i) => ({ ...g, i })).sort((a, b) => b.points - a.points || a.i - b.i)
  const seen = new Map<string, number>()
  const factors = new Array<number>(games.length).fill(1)
  for (const g of order) {
    const n = seen.get(g.key) ?? 0
    seen.set(g.key, n + 1)
    factors[g.i] = n === 0 ? 1 : n === 1 ? 0.5 : 0.1
  }
  return factors
}
