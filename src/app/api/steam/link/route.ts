import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { steamApiKey } from '@/lib/fetchSteam'
import { findSteamAccount, parseSteamQuery, type SteamAccount } from '@/lib/steamAccount'
import { forgetUser } from '@/lib/userRecord'

/**
 * Links a Steam account by what the user types: a custom URL name, a profile
 * link or a SteamID64 — like PSN, no Steam sign-in. Nothing proves the account
 * is theirs, and one Steam account may be linked to several users here; it
 * only has to exist and be public, which is checked now so it fails now, not
 * on every page later.
 */
export async function POST(req: Request) {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  const key = steamApiKey()
  if (!key) return NextResponse.json({ error: 'not-configured' }, { status: 503 })

  let input: unknown
  try {
    input = ((await req.json()) as { query?: unknown })?.query
  } catch {
    return NextResponse.json({ error: 'invalid-query' }, { status: 400 })
  }
  const query = parseSteamQuery(input)
  if (!query) return NextResponse.json({ error: 'invalid-query' }, { status: 400 })

  let account: SteamAccount | null
  try {
    account = await findSteamAccount(query, key)
  } catch (err) {
    console.error('[steam/link] lookup', err)
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
  if (!account) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  if (!account.isPublic) return NextResponse.json({ error: 'private' }, { status: 403 })

  try {
    await pool.query('UPDATE users SET steamid = $1, steamusername = $2 WHERE id = $3', [
      account.steamid,
      account.personaname || null,
      auth.id,
    ])
  } catch (err) {
    console.error('[steam/link] save', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }

  forgetUser(auth.id)
  return NextResponse.json({ steamid: account.steamid, steamusername: account.personaname })
}
