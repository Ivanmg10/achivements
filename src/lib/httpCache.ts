import { NextResponse } from 'next/server'

/**
 * JSON response carrying a private Cache-Control header matching the
 * underlying raCache TTL. Even when raCache already has the data warm in
 * memory, without this header every request still pays full Next.js route
 * execution — this lets the browser (and any single client) skip the round
 * trip entirely for repeat fetches within the TTL window (tab refocus,
 * multiple tabs, a fast back/forward nav). `private` because every route
 * that uses this returns data scoped to the requester's own session/cookie,
 * never safe to cache at a shared/CDN layer.
 */
export function cachedJson<T>(data: T, ttlMs: number, { sameForEveryone = false }: { sameForEveryone?: boolean } = {}): NextResponse {
  const maxAge = Math.max(0, Math.floor(ttlMs / 1000))
  // Vary: the refresh button sets a cookie, and its refetch must not be answered from this copy.
  // But the session cookie is rewritten on every session read, so with it the browser's copy almost
  // never served (#101). `sameForEveryone`: an answer that depends only on the URL (a game's
  // definition, its comments), never on who asks and never refreshed by cookie, so it may skip it.
  return NextResponse.json(data, {
    headers: sameForEveryone ? { 'Cache-Control': `private, max-age=${maxAge}` } : { 'Cache-Control': `private, max-age=${maxAge}`, Vary: 'Cookie' },
  })
}
