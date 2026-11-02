import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { fetchShared } from '@/lib/fetchShared'
import type { RetroAchievement } from '@/types/types'
import type { GameSource, SteamAchievementUnified } from '@/types/steam'
import type { PsnTrophy } from '@/types/psn'
import type { XboxAchievement } from '@/types/xbox'
import { fromPsn, fromRa, fromSteam, fromXbox, type InsightAchievement } from '@/utils/gameInsights'
import { psnTitleId } from '@/utils/psnTitles'
import { toSteamLanguage } from '@/utils/steamLanguage'

type Art = { art: string[]; poster: string | null }
type Loaded = Art & { items: InsightAchievement[]; ra?: { items: RetroAchievement[]; players: number } }
type Answer = ({ key: string } & Loaded) | { key: string; error: true }

async function json(url: string): Promise<unknown> {
  const res = await fetchShared(url)
  if (!res.ok) throw new Error(`${url.split('?')[0]} ${res.status}`)
  return res.json()
}

/** A game's pictures from IGDB, through the route that has them. A failure only means none. */
async function igdbPictures(url: string): Promise<Art> {
  try {
    const data = (await json(url)) as { heroUrl?: string | null; coverUrl?: string | null }
    return { art: data.heroUrl ? [data.heroUrl] : [], poster: data.coverUrl ?? null }
  } catch (err) {
    console.error("Could not read the game's pictures:", err)
    return { art: [], poster: null }
  }
}

const raImage = (path: string) => `https://retroachievements.org${path}`

/** One game's achievements on any platform, read through the routes its page uses, in the shape the insights take; and the pictures those routes give. */
async function load(source: GameSource, id: number, lang: string): Promise<Loaded> {
  if (source === 'ra') {
    const [progress, igdb] = await Promise.all([json(`/api/getGameProgression?gameId=${id}`), igdbPictures(`/api/getGameArt?gameId=${id}`)])
    const data = progress as {
      Achievements?: Record<string, RetroAchievement | undefined>
      NumDistinctPlayers?: number
      ImageIngame?: string
      ImageTitle?: string
      ImageBoxArt?: string
    }
    const list = Object.values(data.Achievements ?? {}).filter((a): a is RetroAchievement => Boolean(a))
    const own = [data.ImageIngame, data.ImageTitle].filter((path): path is string => Boolean(path)).map(raImage)
    return {
      items: fromRa(list, data.NumDistinctPlayers ?? 0, id),
      art: [...igdb.art, ...own],
      poster: data.ImageBoxArt ? raImage(data.ImageBoxArt) : igdb.poster,
      ra: { items: list, players: data.NumDistinctPlayers ?? 0 },
    }
  }
  if (source === 'steam') {
    const data = await json(`/api/steam/achievements?appid=${id}&lang=${toSteamLanguage(lang)}`)
    if (!Array.isArray(data)) throw new Error('Unexpected Steam answer')
    return { items: fromSteam(data as SteamAchievementUnified[], id), art: [], poster: null }
  }
  if (source === 'psn') {
    const data = (await json(`/api/psn/trophies?id=${encodeURIComponent(psnTitleId(id))}&lang=${lang}`)) as { trophies?: PsnTrophy[] }
    if (!Array.isArray(data.trophies)) throw new Error('Unexpected PSN answer')
    return { items: fromPsn(data.trophies, id), art: [], poster: null }
  }
  const data = (await json(`/api/xbox/achievements?id=${id}&lang=${lang}`)) as { achievements?: XboxAchievement[] }
  if (!Array.isArray(data.achievements)) throw new Error('Unexpected Xbox answer')
  return { items: fromXbox(data.achievements, id), ...(await igdbPictures(`/api/xbox/details?id=${id}`)) }
}

/**
 * A game's achievements, for what is worked out from them (the next easiest,
 * how many are left), and a wide picture of it where there is one, asked for
 * when a game is given. Shares the request with the game's own page when both
 * ask at once.
 */
export function useGameInsights(source: GameSource | null, id: number | null) {
  const { lang } = useLanguage()
  const want = source !== null && id !== null ? `${source}:${id}:${lang}` : null
  const [answer, setAnswer] = useState<Answer | null>(null)

  useEffect(() => {
    if (want === null || source === null || id === null) return
    let live = true
    load(source, id, lang).then(
      (loaded) => {
        if (live) setAnswer({ key: want, ...loaded })
      },
      (err) => {
        console.error('Could not read the game\'s achievements:', err)
        if (live) setAnswer({ key: want, error: true })
      },
    )
    return () => {
      live = false
    }
  }, [want, source, id, lang])

  const settled = answer?.key === want ? answer : null
  return {
    items: settled && 'items' in settled ? settled.items : [],
    /** Wide pictures of the game, best first, where its reads give any (IGDB's, RA's screenshots). */
    art: settled && 'items' in settled ? settled.art : [],
    /** Its box art, when its platform's page reads one (RA's own, Xbox's from IGDB). */
    poster: settled && 'items' in settled ? settled.poster : null,
    /** RA's original rows, so its targets can open the same detail as gameInfo. */
    ...(settled && 'ra' in settled ? { ra: settled.ra } : {}),
    loading: want !== null && settled === null,
    error: settled !== null && 'error' in settled,
  }
}
