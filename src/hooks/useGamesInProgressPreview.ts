import { RetroAchievementsGameCompleted } from '@/types/types'
import { getGamesInProgress } from '@/utils/apiCallsUtils'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

export function useGamesInProgressPreview() {
  const { status, data: session } = useSession()
  const [listGames, setListGames] = useState<RetroAchievementsGameCompleted[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (status === 'loading') return
    if (status !== 'authenticated') { setIsLoading(false); return }
    if (hasFetched.current) return
    hasFetched.current = true
    setIsLoading(true)
    getGamesInProgress(session, setListGames).finally(() => setIsLoading(false))
  }, [status])

  return { listGames, isLoading }
}
