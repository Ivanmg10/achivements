import { useSession, type SessionContextValue } from 'next-auth/react'

/**
 * `useSession()`, but signed in stays signed in while `update()` re-reads the
 * session. next-auth flips `status` to 'loading' and back during an update, so
 * everything keyed on `status === 'authenticated'` (Vault Points, presence, a
 * game's progression…) asked again on every page load, after RaUserRefresher's
 * update (#101). Only the first read, with no session yet, is 'loading'.
 */
export function useAuthSession(): SessionContextValue {
  const session = useSession()
  // The types say 'loading' has no data; during an update it keeps the session it had.
  const data = (session as { data: SessionContextValue['data'] }).data
  if (session.status === 'loading' && data) return { data, status: 'authenticated', update: session.update }
  return session
}
