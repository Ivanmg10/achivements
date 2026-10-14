import { useCallback, useMemo } from 'react'
import { useStorageValue } from '@/hooks/useStorageValue'
import type { UserSearchResult } from '@/hooks/useUserSearch'

const KEY = 'recent-user-searches'
const MAX = 5

export type RecentUser = Pick<UserSearchResult, 'username' | 'avatar'>

function parse(raw: string | null | undefined): RecentUser[] {
  if (!raw) return []
  try {
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list.filter((u) => u && typeof u.username === 'string').slice(0, MAX) : []
  } catch {
    return []
  }
}

/**
 * The last profiles opened from the user search, newest first, kept in this
 * browser only. Opening one again moves it to the top.
 */
export function useRecentUsers() {
  const [raw, save] = useStorageValue(KEY)
  const recent = useMemo(() => parse(raw), [raw])

  const remember = useCallback(
    (user: RecentUser) => {
      const rest = parse(raw).filter((u) => u.username.toLowerCase() !== user.username.toLowerCase())
      save(JSON.stringify([{ username: user.username, avatar: user.avatar ?? null }, ...rest].slice(0, MAX)))
    },
    [raw, save],
  )
  const clear = useCallback(() => save(null), [save])

  return { recent, remember, clear }
}
