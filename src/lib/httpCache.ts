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
export function cachedJson<T>(data: T, ttlMs: number): NextResponse {
  const maxAge = Math.max(0, Math.floor(ttlMs / 1000))
  return NextResponse.json(data, {
    headers: { 'Cache-Control': `private, max-age=${maxAge}` },
  })
}
