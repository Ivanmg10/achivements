import { WantToPlayGame } from '@/types/types'
import { getWantGames } from '@/utils/apiCallsUtils'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

export function useWantGamesPreview() {
  const { status, data: session } = useSession()
  const [wantGames, setWantGames] = useState<WantToPlayGame[]>([])
  const [error, setError] = useState<string>()
  const hasFetched = useRef(false)

  useEffect(() => {
    if (status === 'authenticated' && !hasFetched.current) {
      hasFetched.current = true
      getWantGames(session, setWantGames, setError)
    }
  }, [status])

  return { wantGames, error }
}
