import { useCallback, useEffect, useState } from 'react'
import type { IgdbDetails } from '@/lib/igdbClient'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'

type Outcome = { details: IgdbDetails | null } | { error: string }

/**
 * IGDB's facts for one PSN game page (summary, studios, genres, screenshots).
 * A 404 means IGDB is not set up or knows no match — not an error, the page
 * just has no details. A failure is kept in `error` and the page goes on
 * without them: they are extras next to the trophies.
 */
export function usePsnGameDetails(titleId: string | null) {
  // Keyed by the title in the owner's list: on a profile, theirs.
  const subject = useSubject()
  const [details, setDetails] = useState<IgdbDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  /** Asks the server; what came back, not yet applied. */
  const request = useCallback(async (id: string): Promise<Outcome> => {
    try {
      const res = await fetch(withSubject(`/api/psn/details?id=${encodeURIComponent(id)}`, subject))
      if (res.status === 404) return { details: null }
      if (!res.ok) throw new Error(`Failed to load game details (${res.status})`)
      return { details: (await res.json()) as IgdbDetails }
    } catch (err) {
      console.error('[usePsnGameDetails]', id, err)
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }, [subject])

  // Another game starts over; state, so while rendering. The load is the effect.
  useWhenChanged([titleId], () => {
    setDetails(null)
    setError(null)
  })

  useEffect(() => {
    if (titleId === null) return
    // Moving to another game before this one answers must not leave its details on screen.
    let current = true
    request(titleId).then((outcome) => {
      if (!current) return
      if ('error' in outcome) setError(outcome.error)
      else setDetails(outcome.details)
    })
    return () => {
      current = false
    }
  }, [titleId, request])

  return { details, error }
}
