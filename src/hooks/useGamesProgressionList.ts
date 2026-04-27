import { RetroAchievementsGameWithAchievements } from '@/types/types'
import { getGamesInfoList } from '@/utils/apiCallsUtils'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

export function useGamesProgressionList(gameIds: string[]) {
  const { status, data: session } = useSession()
  const [games, setGames] = useState<RetroAchievementsGameWithAchievements[]>([])
  const hasFetched = useRef(false)

  useEffect(() => {
    /* istanbul ignore if */
    if (status === 'authenticated' && !hasFetched.current) {
      hasFetched.current = true
      gameIds.forEach((id) => getGamesInfoList(id, session, setGames))
    }
  }, [status])

  return games
}
