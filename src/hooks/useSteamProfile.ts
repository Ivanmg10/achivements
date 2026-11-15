import { useSession } from 'next-auth/react'
import type { SteamProfile } from '@/types/steam'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { usePlatformRead } from '@/hooks/usePlatformRead'

const SPEC = {
  tag: 'useSteamProfile',
  errorFrom: async (res: Response) => `Failed to load Steam profile (${res.status})`,
  failure: (err: unknown) => (err instanceof Error ? err.message : 'Unknown error'),
}

/** The linked Steam profile (persona, avatar, level, what they are playing right now). */
export function useSteamProfile() {
  const { data: session } = useSession()
  const subject = useSubject()
  const steamid = session?.user?.steamid ?? null
  const { data: profile, error, isLoading, retry } = usePlatformRead<SteamProfile, string>(
    steamid ? withSubject('/api/steam/profile', subject) : null,
    SPEC,
  )
  return { profile, isLoading, error, retry }
}
