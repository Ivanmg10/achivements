import { useEffect, useRef, useState } from 'react'
import type { PsnSummary } from '@/lib/psnClient'

/**
 * Someone's PSN headline numbers, for their public page. Most users have no
 * PSN linked (404), and a private or unreachable one is no reason to break the
 * page: in every such case `summary` stays null and the page shows no card.
 */
export function usePublicUserPsn(raUsername: string) {
  const [summary, setSummary] = useState<PsnSummary | null>(null)
  const fetchedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!raUsername || fetchedFor.current === raUsername) return
    fetchedFor.current = raUsername
    setSummary(null)
    fetch(`/api/public/user/psn?u=${encodeURIComponent(raUsername)}`)
      .then((res) => {
        if (res.status === 404 || res.status === 403) return null
        if (!res.ok) throw new Error(`public psn ${res.status}`)
        return res.json() as Promise<PsnSummary>
      })
      .then(setSummary)
      .catch((err) => console.error('[usePublicUserPsn]', err))
  }, [raUsername])

  return { summary }
}
