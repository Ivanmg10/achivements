import { NextResponse } from 'next/server'

const DEFAULT_RETRY_S = 60

/**
 * What a Steam route answers when Steam failed it. A 429 stays a 429, which the
 * client does not retry, because asking again is what Steam just refused;
 * anything else is Steam being unavailable (503), which it does.
 */
export function steamFailure(err: unknown, message = 'Steam API unavailable'): NextResponse {
  if ((err as { status?: number } | null)?.status === 429) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429, headers: { 'Retry-After': String(DEFAULT_RETRY_S) } })
  }
  return NextResponse.json({ message }, { status: 503 })
}
