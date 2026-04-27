import { RetroAchievementsGameCompleted } from '@/types/types'
import { getGamesInProgress } from '@/utils/apiCallsUtils'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

export function useGamesInProgressPreview() {
  const { status, data: session } = useSession()
  const [listGames, setListGames] = useState<RetroAchievementsGameCompleted[]>([])
  const hasFetched = useRef(false)

  useEffect(() => {
    /* istanbul ignore if */
    if (status === 'authenticated' && !hasFetched.current) {
      hasFetched.current = true
      getGamesInProgress(session, setListGames)
    }
  }, [status])

  return listGames
}
