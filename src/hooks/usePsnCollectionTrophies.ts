import { useEffect, useState } from 'react'
import type { PsnTrophy, PsnTrophyGroup } from '@/types/psn'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { psnErrorFrom, type PsnError } from '@/hooks/usePsnLink'
import { withSubject } from '@/utils/withSubject'
import { fetchShared } from '@/lib/fetchShared'

export type PsnCollectionGameTrophies = { trophies: PsnTrophy[]; groups: PsnTrophyGroup[] }

type Outcome = { byGame: Record<string, PsnCollectionGameTrophies>; error: PsnError | null }

/** Every game's trophies, asked at once; the first game that fails fails the whole. */
async function request(titleIds: string[], lang: string, subject: string | null): Promise<Outcome> {
  try {
    const answers = await Promise.all(
      titleIds.map(async (id) => {
        const res = await fetchShared(withSubject(`/api/psn/trophies?id=${encodeURIComponent(id)}&lang=${lang}`, subject))
        if (!res.ok) return { id, error: await psnErrorFrom(res) }
        const data = (await res.json()) as { trophies?: PsnTrophy[]; groups?: PsnTrophyGroup[] }
        if (!Array.isArray(data.trophies)) throw new Error('Unexpected PSN response')
        return { id, value: { trophies: data.trophies, groups: data.groups ?? [] } }
      }),
    )
    const failed = answers.find((a) => 'error' in a)
    if (failed && 'error' in failed) return { byGame: {}, error: failed.error ?? 'failed' }
    return { byGame: Object.fromEntries(answers.map((a) => [a.id, 'value' in a ? a.value! : { trophies: [], groups: [] }])), error: null }
  } catch (err) {
    console.error('[usePsnCollectionTrophies]', err)
    return { byGame: {}, error: 'failed' }
  }
}

/**
 * The trophies of every game in a PSN collection (The Ezio Collection → AC II,
 * Brotherhood), by trophy set, for its card in the recent feed. Each game is
 * the same request its own card makes, so an answer already in flight is shared.
 */
export function usePsnCollectionTrophies(titleIds: string[]) {
  const { lang } = useLanguage()
  const subject = useSubject()
  const ids = titleIds.join(',')
  const wanted = ids ? `${ids}:${lang}:${subject ?? ''}` : null
  const [answer, setAnswer] = useState<(Outcome & { key: string }) | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!wanted) return
    let live = true
    request(ids.split(','), lang, subject).then((outcome) => {
      if (live) setAnswer({ key: wanted, ...outcome })
    })
    return () => {
      live = false
    }
  }, [wanted, ids, lang, subject, attempt])

  const current = answer && answer.key === wanted ? answer : null
  return {
    byGame: current?.byGame ?? {},
    isLoading: Boolean(wanted) && current === null,
    error: current?.error ?? null,
    retry: () => {
      setAnswer(null)
      setAttempt((n) => n + 1)
    },
  }
}
