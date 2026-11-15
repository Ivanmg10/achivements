import { UserRankAndScore } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useSubject } from '@/context/SubjectContext'
import { useRetryingRead } from '@/hooks/useRetryingRead'
import { withSubject } from '@/utils/withSubject'

const asRank = (data: unknown) =>
  data && typeof data === 'object' && !Array.isArray(data) && 'Rank' in data ? (data as UserRankAndScore) : null

export function useUserRank() {
  const { data: session } = useSession()
  const subject = useSubject()
  const rausername = session?.user?.rausername
  // Keyed by the RA account too: another one linked never paints the last one's answers.
  const user = session?.user?.id ? `${session.user.id}:${rausername ?? ''}` : undefined
  const read = useRetryingRead(rausername ? withSubject('/api/getUserRankAndScore', subject) : null, { parse: asRank, keepFor: user })
  return { rank: read.data, isLoading: read.isLoading, error: read.error, refetch: read.refetch }
}
