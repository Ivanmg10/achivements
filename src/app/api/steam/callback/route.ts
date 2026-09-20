import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'
import { verifyAssertion, extractSteamId, verifyState, configuredOrigin } from '@/lib/steamOpenId'
import { fetchSteam, steamApiKey, STEAM_API_BASE } from '@/lib/fetchSteam'

/** Sends the user back to /user with a flag the UI turns into a message. */
function back(origin: string, status: 'linked' | string) {
  const url = new URL('/user', origin)
  url.searchParams.set('steam', status)
  return NextResponse.redirect(url)
}

/** Best-effort persona name. Linking must not fail just because the lookup did. */
async function fetchPersonaName(steamId: string): Promise<string | null> {
  const key = steamApiKey()
  if (!key) return null
  try {
    const data = await fetchSteam(
      `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(key)}&steamids=${steamId}`,
    )
    const players = (data as { response?: { players?: { personaname?: string }[] } })?.response?.players
    return players?.[0]?.personaname ?? null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const origin = configuredOrigin()
  if (!origin) {
    return NextResponse.json({ message: 'NEXTAUTH_URL is not configured' }, { status: 503 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return back(origin, 'unauthorized')

  const params = req.nextUrl.searchParams

  if (params.get('openid.mode') === 'cancel') return back(origin, 'cancelled')

  if (!verifyState(params.get('state'), session.user.id)) return back(origin, 'invalid_state')

  // Ask Steam to vouch for the signature before trusting any of these params.
  const verified = await verifyAssertion(params)
  if (!verified) return back(origin, 'invalid_assertion')

  const steamId = extractSteamId(params.get('openid.claimed_id'))
  if (!steamId) return back(origin, 'invalid_identity')

  const personaName = await fetchPersonaName(steamId)

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE steamid = $1 AND id <> $2',
      [steamId, session.user.id],
    )
    if (existing.rowCount && existing.rowCount > 0) return back(origin, 'already_linked')

    await pool.query(
      'UPDATE users SET steamid = $1, steamusername = $2 WHERE id = $3',
      [steamId, personaName, session.user.id],
    )
  } catch {
    return back(origin, 'error')
  }

  return back(origin, 'linked')
}
