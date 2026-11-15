import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { LibraryGame } from '@/utils/library'
import { fetchGameAchievements, type GameAchievementList } from '@/utils/gameAchievements'
import { raBadgeUrl } from '@/utils/raAssets'
import { showcaseChoices, type ChoiceInput, type ShowcaseChoice } from '@/utils/showcase'

type Outcome = { key: string; choices: ShowcaseChoice[] } | { key: string; error: true }

function choicesOf({ source, list }: GameAchievementList): ChoiceInput[] {
  if (source === 'ra') {
    return [...list].sort((a, b) => (a.DisplayOrder ?? 0) - (b.DisplayOrder ?? 0)).map((a) => ({
      key: String(a.ID), title: a.Title, description: a.Description, badge: raBadgeUrl(a.BadgeName) ?? null, earnedAt: a.DateEarnedHardcore || a.DateEarned,
    }))
  }
  if (source === 'steam') {
    return list.map((a) => ({ key: a.apiname, title: a.title, description: a.description, badge: a.badgeUrl, earnedAt: a.earned ? a.dateEarned : null, hidden: a.hidden }))
  }
  if (source === 'psn') {
    return list.map((t) => ({ key: String(t.id), title: t.name, description: t.detail, badge: t.iconUrl, earnedAt: t.earned ? t.earnedAt : null, hidden: t.hidden }))
  }
  return list.map((a) => ({ key: a.id, title: a.name, description: a.description, badge: a.iconUrl, earnedAt: a.unlocked ? a.unlockedAt : null, hidden: a.secret }))
}

/** One game's achievements, read through the same routes its page uses, as picker choices. */
async function request(game: LibraryGame, lang: string): Promise<Outcome> {
  try {
    const { source, id, title } = game
    return { key: game.key, choices: showcaseChoices(source, id, title, choicesOf(await fetchGameAchievements(source, id, lang))) }
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
