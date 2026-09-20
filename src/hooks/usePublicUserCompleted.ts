import { useEffect, useRef, useState } from 'react'
import { RetroAchievementsGameCompleted } from '@/types/types'

export function usePublicUserCompleted(raUsername: string) {
  const [completed, setCompleted] = useState<RetroAchievementsGameCompleted[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const fetchedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!raUsername || fetchedFor.current === raUsername) return
    fetchedFor.current = raUsername
    setCompleted([])
    setIsLoading(true)
    fetch(`/api/public/user/completed?u=${encodeURIComponent(raUsername)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then((data) => {
        setCompleted(Array.isArray(data) ? data : [])
        setIsLoading(false)
      })
      .catch(() => {
        setCompleted([])
        setIsLoading(false)
      })
  }, [raUsername])

  return { completed, isLoading }
}
