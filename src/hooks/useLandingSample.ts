import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { Lang } from '@/utils/languages'
import { utcDay } from '@/utils/dates'

/** What a load answered, for the key it was asked for; `list` null when it failed. */
type Answer<T> = { key: string; list: T[] | null }

/**
 * The achievements or trophies of one of the landing library's examples, in the reader's language, read when the game
 * is opened (`id`: a Steam app or a PSN trophy set; null: none open) with `load`, one of `sample-library/`'s loaders.
 * Loading is derived from whether the answer is the one asked for; a failed chunk can be asked again with `retry`.
 */
export function useLandingSample<I extends string | number, T>(id: I | null, load: (id: I, lang: Lang, today: string) => Promise<T[]>) {
  const { lang } = useLanguage()
  const [today] = useState(() => utcDay(Date.now()))
  const [attempt, setAttempt] = useState(0)
  const [answer, setAnswer] = useState<Answer<T> | null>(null)
  const key = `${id}:${lang}:${attempt}`

  useEffect(() => {
    if (id === null) return
    let live = true
    load(id, lang, today)
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
  }, [id, load, lang, today, key])

  const current = answer?.key === key ? answer : null
  return {
    list: current?.list ?? [],
    isLoading: id !== null && current === null,
    error: current !== null && current.list === null,
    retry: () => setAttempt((n) => n + 1),
  }
}
