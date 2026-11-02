import { loadRaYear } from '@/lib/raYear'
import { loadSteamYear } from '@/lib/steamUnlockYear'
import { psnLanguage, psnRecentTrophies, psnTitles } from '@/lib/psnClient'
import { xboxLanguage, xboxLibrary, xboxRecentAchievements } from '@/lib/xboxClient'
import { visibleGamesForUser } from '@/lib/gameVisibility'
import { canUseXbox } from '@/utils/xboxAccess'
import { isConsoleShown } from '@/utils/consoleFilter'
import { toSteamLanguage } from '@/utils/steamLanguage'
import { toRecentAchievement } from '@/utils/steamMappers'
import { psnToRecentAchievement } from '@/utils/psnMappers'
import { xboxToRecentAchievement } from '@/utils/xboxMappers'
import { streakSummary, type StreakSummary } from '@/utils/streaks'
import type { RecentAchievement } from '@/types/types'
import type { GameSource } from '@/types/steam'

/** The signed-in user's accounts, as the session has them (never someone else's: see the route). */
export type StreakOwner = {
  id: string
  rausername?: string
  raid?: string
  steamid?: string
  psnaccountid?: string
  xboxxuid?: string
  admin?: boolean
}

/** The consoles unticked in preferences, per platform, as the browser keeps them (`hidden-consoles:<source>`). */
export type HiddenConsoles = Partial<Record<'ra' | 'psn' | 'xbox', ReadonlySet<string>>>

const CONSOLE_SOURCES = ['ra', 'psn', 'xbox'] as const
const MAX_CONSOLES = 100
const MAX_NAME = 64

/** `{"psn":["PS3"],…}` from the query, or null when it is not that. Unknown keys and odd values are refused whole. */
export function parseHiddenConsoles(raw: string | null): HiddenConsoles | null {
  if (!raw) return {}
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const hidden: HiddenConsoles = {}
  for (const [key, list] of Object.entries(value)) {
    if (!(CONSOLE_SOURCES as readonly string[]).includes(key)) return null
    if (!Array.isArray(list) || list.length > MAX_CONSOLES) return null
    if (!list.every((name) => typeof name === 'string' && name.length > 0 && name.length <= MAX_NAME)) return null
    hidden[key as (typeof CONSOLE_SOURCES)[number]] = new Set(list as string[])
  }
  return hidden
}

export type StreakResult = StreakSummary & {
  /** Linked platforms whose year could not be read: the streak is counted without them. */
  failed: GameSource[]
}

/** The games of a library on a console the person unticked. Only asked for when something is unticked. */
async function hiddenIds<G extends { id: number; consoleName: string }>(hidden: ReadonlySet<string> | undefined, load: () => Promise<G[]>) {
  if (!hidden?.size) return null
  const games = await load()
  return new Set(games.filter((g) => !isConsoleShown(g.consoleName, hidden)).map((g) => g.id))
}

/**
 * The header's streak, counted on the server from the same year the streak page
 * reads (the same loaders, so the same caches), with hidden games and unticked
 * consoles left out as the page does. A few bytes instead of a year of unlocks
 * and two libraries on every route (#101). Days are UTC, like the page's.
 *
 * Each platform is read on its own: one failing is named in `failed` and the
 * streak is counted from the rest, as the page does. Xbox only for whoever may use it.
 */
export async function loadStreak(owner: StreakOwner, lang: string, hidden: HiddenConsoles, now = Date.now()): Promise<StreakResult> {
  const { id } = owner
  const steamKey = process.env.STEAM_API_KEY?.trim()

  const reads: [GameSource, () => Promise<RecentAchievement[]>][] = []
  if (owner.rausername && owner.raid) {
    const { rausername, raid } = owner
    reads.push(['ra', async () => {
      const year = (await loadRaYear(id, rausername, raid)) as RecentAchievement[]
      const visible = await visibleGamesForUser(id, year, 'ra', (a) => a.GameID)
      return hidden.ra?.size ? visible.filter((a) => isConsoleShown(a.ConsoleName, hidden.ra!)) : visible
    }])
  }
  if (owner.steamid && steamKey) {
    const auth = { id, steamid: owner.steamid, apiKey: steamKey }
    reads.push(['steam', async () => {
      const year = await loadSteamYear(auth, toSteamLanguage(lang))
      return (await visibleGamesForUser(id, year, 'steam', (a) => a.appId)).map(toRecentAchievement)
    }])
  }
  if (owner.psnaccountid) {
    const accountId = owner.psnaccountid
    reads.push(['psn', async () => {
      const [year, off] = await Promise.all([
        psnRecentTrophies(accountId, 366, id, psnLanguage(lang)),
        hiddenIds(hidden.psn, () => psnTitles(accountId, id)),
      ])
      const visible = await visibleGamesForUser(id, year, 'psn', (t) => t.gameId)
      return visible.map(psnToRecentAchievement).filter((a) => !off?.has(a.GameID))
    }])
  }
  if (owner.xboxxuid && canUseXbox(owner.admin)) {
    const xuid = owner.xboxxuid
    reads.push(['xbox', async () => {
      const [year, off] = await Promise.all([
        xboxRecentAchievements(xuid, 'year', 366, id, xboxLanguage(lang)),
        hiddenIds(hidden.xbox, () => xboxLibrary(xuid, id)),
      ])
      const visible = await visibleGamesForUser(id, year, 'xbox', (a) => a.gameId)
      return visible.map(xboxToRecentAchievement).filter((a) => !off?.has(a.GameID))
    }])
  }

  const settled = await Promise.allSettled(reads.map(([, read]) => read()))
  const failed: GameSource[] = []
  const achievements: RecentAchievement[] = []
  settled.forEach((result, i) => {
    if (result.status === 'fulfilled') achievements.push(...result.value)
    else {
      failed.push(reads[i][0])
      console.error(`[meStreak] ${reads[i][0]}`, result.reason)
    }
  })
  // Every platform failing is not "no streak": it is "try later".
  if (reads.length && failed.length === reads.length) throw new StreakUnavailable(failed)
  return { ...streakSummary(achievements, now), failed }
}

/** No linked platform's year could be read. */
export class StreakUnavailable extends Error {
  constructor(readonly failed: GameSource[]) {
    super(`streak: ${failed.join(', ')} unavailable`)
  }
}
