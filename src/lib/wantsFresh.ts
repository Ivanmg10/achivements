import { cookies } from 'next/headers'
import { REFRESH_COOKIE } from '@/lib/refreshMark'

/**
 * An entry the refresh button may replace has to be at least this old. It is
 * the whole rate limit: however many times (or by whom) the signal is sent, one
 * cache key reaches the upstream API at most once a minute. The cookie is the
 * client's to set, so nothing here may depend on it being honest.
 */
export const MIN_REFRESH_AGE_MS = 60 * 1000

/** Whether this request came from the refresh button. False outside a request (cron, scripts, tests). */
export async function wantsFresh(): Promise<boolean> {
  try {
    return (await cookies()).get(REFRESH_COOKIE)?.value === '1'
  } catch {
    // No request scope, so no cookies to read.
    return false
  }
}
