import { NextRequest, NextResponse } from 'next/server'

/** The image hosts the games' art comes from; nothing else is fetched (no open proxy, no SSRF). */
const HOSTS = ['retroachievements.org', 'steamstatic.com', 'steampowered.com', 'steamcdn-a.akamaihd.net', 'playstation.com', 'playstation.net', 'xboxlive.com', 'igdb.com', 's-microsoft.com']
const MAX_BYTES = 3 * 1024 * 1024
const TIMEOUT_MS = 8_000
const MAX_REDIRECTS = 3
/** Raster only: served from this site, an SVG could run script here. Steam's icons are .ico. */
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/x-icon', 'image/vnd.microsoft.icon']

export function allowedImageUrl(raw: string, origin: string): URL | null {
  let url: URL
  try {
    url = new URL(raw, origin)
  } catch {
    return null
  }
  // Our own Steam icon route redirects to Steam's CDN; anything else on this site is refused.
  if (url.origin === origin) return url.pathname === '/api/steam/icon' ? url : null
  if (url.protocol !== 'https:') return null
  const host = url.hostname.toLowerCase()
  return HOSTS.some((h) => host === h || host.endsWith(`.${h}`)) ? url : null
}

/** Follows redirects by hand, so that no hop off the list is ever requested; null when one tries. */
async function fetchAllowed(start: URL, origin: string): Promise<Response | null> {
  let url = start
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(url, { redirect: 'manual', headers: { cookie: '' }, signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (res.status < 300 || res.status >= 400) return res
    const next = allowedImageUrl(new URL(res.headers.get('location') ?? '', url).href, origin)
    if (!next) return null
    url = next
  }
  return null
}

/** The body, or null as soon as it passes the limit: it is never held whole first. */
async function readCapped(res: Response): Promise<Uint8Array<ArrayBuffer> | null> {
  if (Number(res.headers.get('content-length') ?? 0) > MAX_BYTES) return null
  const reader = res.body?.getReader()
  if (!reader) return new Uint8Array(0)
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const body = new Uint8Array(size)
  let at = 0
  for (const chunk of chunks) {
    body.set(chunk, at)
    at += chunk.byteLength
  }
  return body
}

/**
 * A game's art served from this site, so the page can read its colour (a
 * canvas cannot read an image from a host that does not allow it). Only the
 * platforms' image hosts, only raster images, at most 3 MB; cached a week.
 */
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin
  const url = allowedImageUrl(req.nextUrl.searchParams.get('url') ?? '', origin)
  if (!url) return NextResponse.json({ error: 'not-allowed' }, { status: 400 })

  try {
    const res = await fetchAllowed(url, origin)
    if (!res) return NextResponse.json({ error: 'not-allowed' }, { status: 400 })
    if (!res.ok) return NextResponse.json({ error: 'upstream' }, { status: 502 })
    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    if (!IMAGE_TYPES.includes(type)) return NextResponse.json({ error: 'not-an-image' }, { status: 415 })
    const body = await readCapped(res)
    if (!body) return NextResponse.json({ error: 'too-large' }, { status: 413 })
    return new NextResponse(body, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=604800, immutable' } })
  } catch (err) {
    console.error('[image-proxy]', url.href, err)
    return NextResponse.json({ error: 'upstream' }, { status: 502 })
  }
}
