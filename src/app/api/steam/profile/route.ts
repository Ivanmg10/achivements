import { NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { TTL } from '@/lib/steamCache'
import { loadSteamProfile } from '@/lib/steamProfile'
import { cachedJson } from '@/lib/httpCache'

export async function GET(req?: Request) {
  const auth = await requireSteamSession(req)
  if (!auth.ok) return auth.response
  const { id, steamid, apiKey } = auth.session

  try {
    const profile = await loadSteamProfile(steamid, apiKey, id)

    if (!profile) {
      return NextResponse.json({ message: 'Steam profile not found' }, { status: 404 })
    }

    return cachedJson(profile, TTL.profile)
  } catch (err) {
    console.error('[steam/profile]', err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}
