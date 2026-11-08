import { RetroAchievementsGameWithAchievements } from '@/types/types'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useRetryingRead } from '@/hooks/useRetryingRead'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'

const asGame = (data: unknown) => ((data as RetroAchievementsGameWithAchievements | null)?.ID ? (data as RetroAchievementsGameWithAchievements) : null)

/** One RA game with the user's progress. Each list row asks for its own, so one attempt per round, then the slow retries. */
export function useGameProgression(gameId: string | null) {
  const { status, data: session } = useAuthSession()
  const subject = useSubject()
  // Keyed by the RA account too: another one linked never paints the last one's answers.
  const user = session?.user?.id ? `${session.user.id}:${session.user.rausername ?? ''}` : undefined
  const url = status === 'authenticated' && gameId ? withSubject(`/api/getGameProgression?gameId=${gameId}`, subject) : null
  const { data: game, isLoading, error, refetch } = useRetryingRead(url, { parse: asGame, keepFor: user, attempts: 1 })
  return { game, isLoading, error, refetch }
}
