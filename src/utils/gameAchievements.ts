import { fetchShared } from '@/lib/fetchShared'
import type { RetroAchievement, RetroAchievementsGameWithAchievements } from '@/types/types'
import type { GameSource } from '@/types/game'
import type { SteamAchievementUnified } from '@/types/steam'
import type { PsnTrophy } from '@/types/psn'
import type { XboxAchievement } from '@/types/xbox'
import { psnTitleId } from '@/utils/psnTitles'
import { toSteamLanguage } from '@/utils/steamLanguage'

/** One game's achievements as its platform gives them; RA's with the rest of its answer (players, pictures). */
export type GameAchievementList =
  | { source: 'ra'; list: RetroAchievement[]; game: Partial<RetroAchievementsGameWithAchievements> }
  | { source: 'steam'; list: SteamAchievementUnified[] }
  | { source: 'psn'; list: PsnTrophy[] }
  | { source: 'xbox'; list: XboxAchievement[] }

/** The achievements of an RA game answer, in RA's map order; none when there is no answer. */
export function raAchievementList(game: { Achievements?: Record<string, RetroAchievement | undefined> | null } | null | undefined): RetroAchievement[] {
  return Object.values(game?.Achievements ?? {}).filter((a): a is RetroAchievement => Boolean(a))
}

/** A GET shared with whoever asks for it at once; anything but a 2xx throws. */
export async function readJson(url: string): Promise<unknown> {
  const res = await fetchShared(url)
  if (!res.ok) throw new Error(`${url.split('?')[0]} ${res.status}`)
  return res.json()
}

function listIn<T>(data: unknown, field: 'trophies' | 'achievements', source: string): T[] {
  const list = (data as Record<string, unknown> | null)?.[field]
  if (!Array.isArray(list)) throw new Error(`Unexpected ${source} answer`)
  return list as T[]
}

/** One game's achievements on any platform, read through the routes its page uses (so the requests are shared with it). */
export async function fetchGameAchievements(source: GameSource, id: number, lang: string): Promise<GameAchievementList> {
  if (source === 'ra') {
    const game = (await readJson(`/api/getGameProgression?gameId=${id}`)) as Partial<RetroAchievementsGameWithAchievements>
    return { source, list: raAchievementList(game), game }
  }
  if (source === 'steam') {
    const data = await readJson(`/api/steam/achievements?appid=${id}&lang=${toSteamLanguage(lang)}`)
    if (!Array.isArray(data)) throw new Error('Unexpected Steam answer')
    return { source, list: data as SteamAchievementUnified[] }
  }
  if (source === 'psn') {
    const data = await readJson(`/api/psn/trophies?id=${encodeURIComponent(psnTitleId(id))}&lang=${lang}`)
    return { source, list: listIn<PsnTrophy>(data, 'trophies', 'PSN') }
  }
  const data = await readJson(`/api/xbox/achievements?id=${id}&lang=${lang}`)
  return { source, list: listIn<XboxAchievement>(data, 'achievements', 'Xbox') }
}
