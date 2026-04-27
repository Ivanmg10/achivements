import { RetroAchievementsGameCompleted } from '@/types/types'
import { getGamesCompleted } from '@/utils/apiCallsUtils'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

export function useGamesCompletedPreview() {
  const { status, data: session } = useSession()
  const [listGames, setListGames] = useState<RetroAchievementsGameCompleted[]>([])
  const [listGamesHardcore, setListGamesHardcore] = useState<RetroAchievementsGameCompleted[]>([])
  const hasFetched = useRef(false)

  useEffect(() => {
    /* istanbul ignore if */
    if (status === 'authenticated' && !hasFetched.current) {
      hasFetched.current = true
      getGamesCompleted(session, setListGames, setListGamesHardcore)
    }
  }, [status])

  return { listGames, listGamesHardcore }
}
