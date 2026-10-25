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

type Loaded = { items: InsightAchievement[]; art: string | null }
type Answer = ({ key: string } & Loaded) | { key: string; error: true }

async function json(url: string): Promise<unknown> {
  const res = await fetchShared(url)
  if (!res.ok) throw new Error(`${url.split('?')[0]} ${res.status}`)
  return res.json()
}

/** A wide picture of the game where its page already reads one (RA's in-game screenshot, Xbox's from IGDB). A failure only means no picture. */
async function wideArt(source: GameSource, id: number, ra: { ImageIngame?: string; ImageTitle?: string } | null): Promise<string | null> {
  if (source === 'ra') {
    const path = ra?.ImageIngame || ra?.ImageTitle
    return path ? `https://retroachievements.org${path}` : null
  }
  if (source !== 'xbox') return null
  try {
    const data = (await json(`/api/xbox/details?id=${id}`)) as { heroUrl?: string | null }
    return data.heroUrl ?? null
  } catch (err) {
    console.error("Could not read the game's wide picture:", err)
    return null
  }
}

/** One game's achievements on any platform, read through the routes its page uses, in the shape the insights take; and its wide art. */
async function load(source: GameSource, id: number, lang: string): Promise<Loaded> {
  if (source === 'ra') {
    const data = (await json(`/api/getGameProgression?gameId=${id}`)) as {
      Achievements?: Record<string, RetroAchievement | undefined>
      NumDistinctPlayers?: number
      ImageIngame?: string
      ImageTitle?: string
    }
    const list = Object.values(data.Achievements ?? {}).filter((a): a is RetroAchievement => Boolean(a))
    return { items: fromRa(list, data.NumDistinctPlayers ?? 0, id), art: await wideArt('ra', id, data) }
  }
  if (source === 'steam') {
    const data = await json(`/api/steam/achievements?appid=${id}&lang=${toSteamLanguage(lang)}`)
    if (!Array.isArray(data)) throw new Error('Unexpected Steam answer')
    return { items: fromSteam(data as SteamAchievementUnified[], id), art: null }
  }
  if (source === 'psn') {
    const data = (await json(`/api/psn/trophies?id=${encodeURIComponent(psnTitleId(id))}&lang=${lang}`)) as { trophies?: PsnTrophy[] }
    if (!Array.isArray(data.trophies)) throw new Error('Unexpected PSN answer')
    return { items: fromPsn(data.trophies, id), art: null }
  }
  const data = (await json(`/api/xbox/achievements?id=${id}&lang=${lang}`)) as { achievements?: XboxAchievement[] }
  if (!Array.isArray(data.achievements)) throw new Error('Unexpected Xbox answer')
  return { items: fromXbox(data.achievements, id), art: await wideArt('xbox', id, null) }
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
    /** A wide picture of the game, when its platform's page reads one. */
    art: settled && 'items' in settled ? settled.art : null,
    loading: want !== null && settled === null,
    error: settled !== null && 'error' in settled,
  }
}
