import { UserAwards } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { useRetryingRead } from '@/hooks/useRetryingRead'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { filterHiddenAwards } from '@/utils/gameVisibility'

const asAwards = (data: unknown) => (data && typeof data === 'object' && !Array.isArray(data) ? (data as UserAwards) : null)

export function useUserAwards() {
  const { data: session } = useSession()
  const subject = useSubject()
  const { hidden } = useHiddenGames()
  // Keyed by the RA account too: another one linked never paints the last one's answers.
  const user = session?.user?.id ? `${session.user.id}:${session.user.rausername ?? ''}` : undefined
  const url = withSubject('/api/getUserAwards', subject)
  const { data: awards, isLoading, error, refetch } = useRetryingRead(session?.user?.rausername ? url : null, { parse: asAwards, keepFor: user })

  const visible = useMemo(
    () => awards && hidden.length ? filterHiddenAwards(awards, hidden.map((game) => `${game.source}:${game.id}`)) : awards,
    [awards, hidden],
  )
  return { awards: visible, isLoading, error, refetch }
}
