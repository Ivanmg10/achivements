'use client'

import { useCallback, useMemo } from 'react'
import { useStorageValue } from '@/hooks/useStorageValue'

const KEY = 'search-recent'
const MAX = 6

function parse(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list.filter((q): q is string => typeof q === 'string' && q.trim() !== '').slice(0, MAX) : []
  } catch {
    return []
  }
}

/**
 * What was searched last in the top bar's search (a result opened from it),
 * newest first, kept in this browser only. Searching it again moves it to the top.
 */
export function useRecentSearches() {
  const [raw, save] = useStorageValue(KEY)
  const recent = useMemo(() => parse(raw), [raw])

  const remember = useCallback(
    (query: string) => {
      const q = query.trim()
      if (!q) return
      const rest = parse(raw).filter((r) => r.toLowerCase() !== q.toLowerCase())
      save(JSON.stringify([q, ...rest].slice(0, MAX)))
    },
    [raw, save],
  )
  const clear = useCallback(() => save(null), [save])

  return { recent, remember, clear }
}
