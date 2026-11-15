import { canUseXbox } from '@/utils/xboxAccess'

export const SESSION_LOOK_KEY = 'session-look'

type LookUser = { raLinked?: boolean; steamid?: unknown; psnaccountid?: unknown; xboxxuid?: unknown; admin?: boolean }

/**
 * What the skeletons need from the session before it can be read, remembered in
 * this browser: nothing signed out, `in` signed in, `tabs` with several
 * platforms, whose home has a switch over the profile. Holds no account data.
 */
export function sessionLook(user: LookUser | null | undefined): 'in' | 'tabs' | null {
  if (!user) return null
  const linked = [user.raLinked, user.steamid, user.psnaccountid, user.xboxxuid && canUseXbox(user.admin)].filter(Boolean)
  return linked.length > 1 ? 'tabs' : 'in'
}
