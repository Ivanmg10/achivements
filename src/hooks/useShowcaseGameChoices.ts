import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { fetchShared } from '@/lib/fetchShared'
import type { RetroAchievement } from '@/types/types'
import type { SteamAchievementUnified } from '@/types/steam'
import type { PsnTrophy } from '@/types/psn'
import type { XboxAchievement } from '@/types/xbox'
import type { LibraryGame } from '@/utils/library'
import { psnTitleId } from '@/utils/psnTitles'
import { toSteamLanguage } from '@/utils/steamLanguage'
import { showcaseChoices, type ShowcaseChoice } from '@/utils/showcase'

type Outcome = { key: string; choices: ShowcaseChoice[] } | { key: string; error: true }

async function json(url: string): Promise<unknown> {
  const res = await fetchShared(url)
  if (!res.ok) throw new Error(`${url.split('?')[0]} ${res.status}`)
  return res.json()
}

/** One game's achievements, read through the same routes its page uses, as picker choices. */
async function request(game: LibraryGame, lang: string): Promise<Outcome> {
  try {
    const { source, id, title } = game
    if (source === 'ra') {
      const data = (await json(`/api/getGameProgression?gameId=${id}`)) as { Achievements?: Record<string, RetroAchievement | undefined> }
      const list = Object.values(data.Achievements ?? {}).filter((a): a is RetroAchievement => Boolean(a))
      return {
        key: game.key,
        choices: showcaseChoices('ra', id, title, list.sort((a, b) => (a.DisplayOrder ?? 0) - (b.DisplayOrder ?? 0)).map((a) => ({
          key: String(a.ID),
          title: a.Title,
          description: a.Description,
          badge: a.BadgeName ? `https://media.retroachievements.org/Badge/${a.BadgeName}.png` : null,
          earnedAt: a.DateEarnedHardcore || a.DateEarned,
        }))),
      }
    }
    if (source === 'steam') {
      const data = await json(`/api/steam/achievements?appid=${id}&lang=${toSteamLanguage(lang)}`)
      if (!Array.isArray(data)) throw new Error('Unexpected Steam answer')
      return {
        key: game.key,
        choices: showcaseChoices('steam', id, title, (data as SteamAchievementUnified[]).map((a) => ({
          key: a.apiname, title: a.title, description: a.description, badge: a.badgeUrl, earnedAt: a.earned ? a.dateEarned : null, hidden: a.hidden,
        }))),
      }
    }
    if (source === 'psn') {
      const data = (await json(`/api/psn/trophies?id=${encodeURIComponent(psnTitleId(id))}&lang=${lang}`)) as { trophies?: PsnTrophy[] }
      if (!Array.isArray(data.trophies)) throw new Error('Unexpected PSN answer')
      return {
        key: game.key,
        choices: showcaseChoices('psn', id, title, data.trophies.map((t) => ({
          key: String(t.id), title: t.name, description: t.detail, badge: t.iconUrl, earnedAt: t.earned ? t.earnedAt : null, hidden: t.hidden,
        }))),
      }
    }
    const data = (await json(`/api/xbox/achievements?id=${id}&lang=${lang}`)) as { achievements?: XboxAchievement[] }
    if (!Array.isArray(data.achievements)) throw new Error('Unexpected Xbox answer')
    return {
      key: game.key,
      choices: showcaseChoices('xbox', id, title, data.achievements.map((a) => ({
        key: a.id, title: a.name, description: a.description, badge: a.iconUrl, earnedAt: a.unlocked ? a.unlockedAt : null, hidden: a.secret,
      }))),
    }
  } catch (err) {
    console.error('[useShowcaseGameChoices]', game.key, err)
    return { key: game.key, error: true }
  }
}

/**
 * The achievements of the game opened in the showcase picker, earned or not.
 * Each game is read once while the picker lives, so going back and forth
 * between games asks nothing again. `retry` asks again after a failure.
 */
export function useShowcaseGameChoices(game: LibraryGame | null) {
  const { lang } = useLanguage()
  const [loaded, setLoaded] = useState<Record<string, ShowcaseChoice[]>>({})
  const [failed, setFailed] = useState<Record<string, boolean>>({})

  const settle = useCallback((outcome: Outcome) => {
    if ('error' in outcome) setFailed((prev) => ({ ...prev, [outcome.key]: true }))
    else setLoaded((prev) => ({ ...prev, [outcome.key]: outcome.choices }))
  }, [])

  const key = game?.key ?? null
  const known = key !== null && (key in loaded || key in failed)

  useEffect(() => {
    if (!game || known) return
    let current = true
    request(game, lang).then((outcome) => {
      if (current) settle(outcome)
    })
    return () => {
      current = false
    }
  }, [game, known, lang, settle])

  const retry = useCallback(() => {
    if (!game) return
    setFailed((prev) => {
      const next = { ...prev }
      delete next[game.key]
      return next
    })
  }, [game])

  return {
    choices: key ? (loaded[key] ?? []) : [],
    isLoading: key !== null && !known,
    error: key !== null && Boolean(failed[key]),
    retry,
  }
}
