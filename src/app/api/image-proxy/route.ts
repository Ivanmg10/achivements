import { NextRequest, NextResponse } from 'next/server'

/** The image hosts the games' art comes from; nothing else is fetched (no open proxy, no SSRF). */
const HOSTS = ['retroachievements.org', 'steamstatic.com', 'steampowered.com', 'steamcdn-a.akamaihd.net', 'playstation.com', 'playstation.net', 'xboxlive.com', 'igdb.com', 's-microsoft.com']
const MAX_BYTES = 3 * 1024 * 1024

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

/**
 * A game's art served from this site, so the page can read its colour (a
 * canvas cannot read an image from a host that does not allow it). Only the
 * platforms' image hosts, only images, at most 3 MB; cached a week.
 */
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin
  const url = allowedImageUrl(req.nextUrl.searchParams.get('url') ?? '', origin)
  if (!url) return NextResponse.json({ error: 'not-allowed' }, { status: 400 })

  try {
    const res = await fetch(url, { redirect: 'follow', headers: { cookie: '' } })
    if (!res.ok) return NextResponse.json({ error: 'upstream' }, { status: 502 })
    // A redirect must land on an allowed host too.
    if (!allowedImageUrl(res.url, origin)) return NextResponse.json({ error: 'not-allowed' }, { status: 400 })
    const type = res.headers.get('content-type') ?? ''
    if (!type.startsWith('image/')) return NextResponse.json({ error: 'not-an-image' }, { status: 415 })
    const body = await res.arrayBuffer()
    if (body.byteLength > MAX_BYTES) return NextResponse.json({ error: 'too-large' }, { status: 413 })
    return new NextResponse(body, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=604800, immutable' } })
  } catch (err) {
    console.error('[image-proxy]', url.href, err)
    return NextResponse.json({ error: 'upstream' }, { status: 502 })
  }
}
