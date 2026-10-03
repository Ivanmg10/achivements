import { NextRequest, NextResponse } from 'next/server'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getAppInfo, clientIconUrl, steamAssetUrl } from '@/lib/steamClient'

type AppInfoResponse = { data?: Record<string, { common?: { clienticon?: string } }> }

/**
 * Redirects to a game's square desktop icon, for use straight in an <img>.
 * Public on purpose: the icon is public, and public profiles show it to
 * visitors with no session. The hash is cached for a month ('' when the game
 * has none, so it is not looked up again). A game without one, or a lookup
 * that fails, gets the cover instead, so a plain <img> never breaks.
 */
export async function GET(req: NextRequest) {
  const appIdRaw = req.nextUrl.searchParams.get('appid')
  if (!appIdRaw || !/^\d+$/.test(appIdRaw)) {
    return NextResponse.json({ message: 'Missing or invalid appid' }, { status: 400 })
  }
  const appId = Number(appIdRaw)

  try {
    const hash = await withSteamCache<string>(`clienticon:${appId}`, TTL.settledProgress, async () => {
      const info = (await getAppInfo(appId)) as AppInfoResponse
      const icon = info.data?.[appIdRaw]?.common?.clienticon ?? ''
      return /^[a-f0-9]{40}$/.test(icon) ? icon : ''
    })

    return NextResponse.redirect(hash ? clientIconUrl(appId, hash) : steamAssetUrl(appId, 'cover'), {
      status: 302,
      headers: { 'Cache-Control': 'public, max-age=604800' },
    })
  } catch (err) {
    console.error('[steam/icon]', appId, err)
    // Not cached, so the icon comes back once steamcmd.net does.
    return NextResponse.redirect(steamAssetUrl(appId, 'cover'), { status: 302, headers: { 'Cache-Control': 'no-store' } })
  }
}
