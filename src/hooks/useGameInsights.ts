import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { RetroAchievement } from '@/types/types'
import type { GameSource } from '@/types/game'
import { fromPsn, fromRa, fromSteam, fromXbox, type InsightAchievement } from '@/utils/gameInsights'
import { fetchGameAchievements, readJson } from '@/utils/gameAchievements'
import { raImageUrl } from '@/utils/raAssets'

type Art = { art: string[]; poster: string | null }
type Loaded = Art & { items: InsightAchievement[]; ra?: { items: RetroAchievement[]; players: number } }
type Answer = ({ key: string } & Loaded) | { key: string; error: true }

/** A game's pictures from IGDB, through the route that has them. A failure only means none. */
async function igdbPictures(url: string): Promise<Art> {
  try {
    const data = (await readJson(url)) as { heroUrl?: string | null; coverUrl?: string | null }
    return { art: data.heroUrl ? [data.heroUrl] : [], poster: data.coverUrl ?? null }
  } catch (err) {
    console.error("Could not read the game's pictures:", err)
    return { art: [], poster: null }
  }
}

/** One game's achievements in the shape the insights take, and the pictures its routes give. */
async function load(source: GameSource, id: number, lang: string): Promise<Loaded> {
  if (source === 'ra') {
    const [read, igdb] = await Promise.all([fetchGameAchievements('ra', id, lang), igdbPictures(`/api/getGameArt?gameId=${id}`)])
    if (read.source !== 'ra') throw new Error('Unexpected RA answer')
    const { list, game } = read
    const players = game.NumDistinctPlayers ?? 0
    const own = [game.ImageIngame, game.ImageTitle].map(raImageUrl).filter((url): url is string => Boolean(url))
    return {
      items: fromRa(list, players, id),
      art: [...igdb.art, ...own],
      poster: raImageUrl(game.ImageBoxArt) ?? igdb.poster,
      ra: { items: list, players },
    }
  }
  const read = await fetchGameAchievements(source, id, lang)
  if (read.source === 'steam') return { items: fromSteam(read.list, id), art: [], poster: null }
  if (read.source === 'psn') return { items: fromPsn(read.list, id), art: [], poster: null }
  if (read.source === 'xbox') return { items: fromXbox(read.list, id), ...(await igdbPictures(`/api/xbox/details?id=${id}`)) }
  throw new Error('Unexpected answer')
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
