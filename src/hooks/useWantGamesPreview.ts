import { WantToPlayGame } from '@/types/types'
import { getWantGames } from '@/utils/apiCallsUtils'
import { useGamesData } from '@/contexts/GamesDataContext'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState, useMemo } from 'react'

export function useWantGamesPreview() {
  const { status, data: session } = useSession()
  const { all: completedGames } = useGamesData()
  const [wantGames, setWantGames] = useState<WantToPlayGame[]>([])
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (status === 'authenticated' && !hasFetched.current) {
      hasFetched.current = true
      getWantGames(session, (games) => { setWantGames(games); setLoading(false) }, setError)
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  const startedIds = useMemo(
    () => new Set(completedGames.filter((g) => g.NumAwarded > 0).map((g) => g.GameID)),
    [completedGames],
  )

  const filteredGames = useMemo(
    () => wantGames.filter((g) => !startedIds.has(g.ID ?? g.GameID!)),
    [wantGames, startedIds],
  )

  return { wantGames: filteredGames, error, loading }
}
