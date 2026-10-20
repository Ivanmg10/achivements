import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameGroup } from '@/types/types'

/** What a CheevoVault user's public page knows about them; see /api/users/[username]. */
export type CheevoUser = {
  username: string
  avatar: string | null
  description: string | null
  location: string | null
  /** Their RetroAchievements name, if linked. */
  ra: string | null
  steam: boolean
  psn: boolean
  /** Only true for a viewer who may see Xbox (an admin, for now). */
  xbox?: boolean
  /** Their names on Steam, PSN and Xbox, when linked. */
  steamName?: string | null
  psnName?: string | null
  xboxName?: string | null
  /** The page is the viewer's own. */
  isSelf?: boolean
  theme?: string | null
  /** Only when they chose to show it. */
  gender?: 'male' | 'female' | 'neutral' | null
  favorites?: Partial<Record<'ra' | 'steam' | 'psn' | 'xbox', { id: number; title: string; imageIcon: string } | null>>
  /** "source:id" of the games they hid from their lists; their page leaves them out. */
  hiddenGames?: string[]
  groups?: GameGroup[]
  /** Whether the viewer follows them. */
  following?: boolean
  /** Seen in the last 5 minutes; false too for who does not share it. */
  online?: boolean
  /** When last seen, rounded to 5 minutes; null if never, or not shared. */
  lastSeenAt?: string | null
  /** Their Vault Points, for the level on the hero; null before they are scored. */
  vaultPoints?: number | null
}

/**
 * A CheevoVault user by name, for their public page. `error` tells apart a
 * user that does not exist ('missing') from a failure worth retrying ('failed').
 */
export function useCheevoUser(username: string) {
  const [user, setUser] = useState<CheevoUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<'missing' | 'failed' | null>(null)
  const fetchedFor = useRef<string | null>(null)

  const load = useCallback((name: string) => {
    setUser(null)
    setError(null)
    setIsLoading(true)
    fetch(`/api/users/${encodeURIComponent(name)}`)
      .then((res) => {
        if (res.status === 404) return null
        if (!res.ok) throw new Error(`user ${res.status}`)
        return res.json() as Promise<CheevoUser>
      })
      .then((data) => {
        if (data) setUser(data)
        else setError('missing')
      })
      .catch((err) => {
        console.error('[useCheevoUser]', err)
        setError('failed')
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!username || fetchedFor.current === username) return
    fetchedFor.current = username
    load(username)
  }, [username, load])

  const retry = useCallback(() => load(username), [load, username])

  return { user, isLoading, error, retry }
}
