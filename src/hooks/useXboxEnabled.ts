import { useSession } from 'next-auth/react'
import { useSubject } from '@/context/SubjectContext'
import { canUseXbox } from '@/utils/xboxAccess'

/**
 * Whether Xbox shows at all for the person looking: an admin while it is
 * admin-only (see canUseXbox). On someone else's page the server only says they
 * have Xbox to a viewer who may see it (/api/users/[username]), so there it is
 * already decided. The server enforces this too — this only keeps the screen
 * from asking for, or drawing, what it would be refused.
 */
export function useXboxEnabled(): boolean {
  const { data: session } = useSession()
  const subject = useSubject()
  return subject ? true : canUseXbox(session?.user?.admin)
}
