import { useEffect, useState } from 'react'

export type FollowCounts = { following: number; followers: number }

async function request(): Promise<FollowCounts | null> {
  try {
    const res = await fetch('/api/follows/count')
    if (!res.ok) throw new Error(`follows/count ${res.status}`)
    const data = await res.json()
    if (typeof data?.following !== 'number' || typeof data?.followers !== 'number') throw new Error('Unexpected counts')
    return data as FollowCounts
  } catch (err) {
    console.error('[useFollowCounts]', err)
    return null
  }
}

/** How many you follow and how many follow you. `error` when they could not be read. */
export function useFollowCounts() {
  const [counts, setCounts] = useState<FollowCounts | null>(null)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    let current = true
    request().then((data) => {
      if (!current) return
      setCounts(data)
      setAnswered(true)
    })
    return () => {
      current = false
    }
  }, [])

  return { counts, isLoading: !answered, error: answered && counts === null }
}
