import { useCallback, useEffect, useState } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useStorageValue } from '@/hooks/useStorageValue'
import { useLanguage } from '@/context/LanguageContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import type { StreakSummary } from '@/utils/streaks'

type Answer = { for: string; summary: StreakSummary | null }

/** The consoles unticked in this browser, as `/api/me/streak` takes them; '' when none. */
export function hiddenParam(lists: Record<'ra' | 'psn' | 'xbox', string | null>): string {
  const hidden: Record<string, string[]> = {}
  for (const [source, raw] of Object.entries(lists)) {
    try {
      const list: unknown = raw ? JSON.parse(raw) : null
      const names = Array.isArray(list) ? list.filter((n): n is string => typeof n === 'string') : []
      if (names.length) hidden[source] = names
    } catch {
      // A value that is not a list hides nothing, as useHiddenConsoles reads it.
    }
  }
  return Object.keys(hidden).length ? JSON.stringify(hidden) : ''
}

async function request(url: string): Promise<StreakSummary | null> {
  try {
    const data = (await fetchWithRetry(url)) as StreakSummary | null
    if (!data || !('active' in data)) throw new Error('Unexpected streak')
    return data
  } catch (err) {
    console.error('[useStreakSummary]', err)
    return null
  }
}

/**
 * The signed-in user's current and best streak, counted on the server: what the
 * header shows on every route, without loading a year of unlocks for it (#101).
 * The streak page and the home still read the year, since they draw it.
 *
 * Asked again when what it counts changes: the language (the caches it shares),
 * a linked account, the consoles unticked in this browser, or a game hidden or
 * shown. Waits for the browser's lists, so the first read is the right one.
 *
 * `streak` is null until the first answer: a 0 meanwhile read as a real streak
 * that became another number seconds later. A failed read is 0, with `error`.
 */
export function useStreakSummary() {
  const { data: session, status } = useAuthSession()
  const { lang } = useLanguage()
  const { revision } = useHiddenGames()
  const [ra] = useStorageValue('hidden-consoles:ra')
  const [psn] = useStorageValue('hidden-consoles:psn')
  const [xbox] = useStorageValue('hidden-consoles:xbox')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [attempt, setAttempt] = useState(0)

  const user = session?.user
  const accounts = [user?.rausername, user?.steamid, user?.psnaccountid, user?.xboxxuid].join('|')
  const read = ra !== undefined && psn !== undefined && xbox !== undefined
  const hidden = read ? hiddenParam({ ra, psn, xbox }) : ''
  const url = `/api/me/streak?lang=${lang}${hidden ? `&hidden=${encodeURIComponent(hidden)}` : ''}`
  const wanted = status === 'authenticated' && read ? `${url}#${accounts}#${revision}#${attempt}` : null

  useEffect(() => {
    if (!wanted) return
    let current = true
    request(url).then((summary) => {
      if (current) setAnswer({ for: wanted, summary })
    })
    return () => {
      current = false
    }
  }, [wanted, url])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  // The last answer stays shown while the next is on its way, so the badge does not blink.
  const summary = answer?.summary ?? null
  const isLoading = wanted !== null && answer?.for !== wanted
  return { streak: answer ? (summary?.active?.days ?? 0) : null, best: summary?.best?.days ?? 0, isLoading, error: answer?.for === wanted && !summary, retry }
}
