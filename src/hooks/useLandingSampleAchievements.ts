import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { loadSampleAchievements } from '@/components/landing-page/sample-library/landingLibrary'
import type { SteamAchievementUnified } from '@/types/steam'
import { utcDay } from '@/utils/dates'

/** What a load answered, for the key it was asked for; `list` null when it failed. */
type Answer = { key: string; list: SteamAchievementUnified[] | null }

/**
 * The achievements of one of the landing library's Steam examples, in the reader's language, read when the game is
 * opened (`appId`; null: none open). Loading is derived from whether the answer is the one asked for; a failed chunk
 * can be asked again with `retry`.
 */
export function useLandingSampleAchievements(appId: number | null) {
  const { lang } = useLanguage()
  const [today] = useState(() => utcDay(Date.now()))
  const [attempt, setAttempt] = useState(0)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const key = `${appId}:${lang}:${attempt}`

  useEffect(() => {
    if (appId === null) return
    let live = true
    loadSampleAchievements(appId, lang, today)
      .then((list) => {
        if (live) setAnswer({ key, list })
      })
      .catch((err) => {
        console.error('[landing] sample achievements', err)
        if (live) setAnswer({ key, list: null })
      })
    return () => {
      live = false
    }
  }, [appId, lang, today, key])

  const current = answer?.key === key ? answer : null
  return {
    achievements: current?.list ?? [],
    isLoading: appId !== null && current === null,
    error: current !== null && current.list === null,
    retry: () => setAttempt((n) => n + 1),
  }
}
