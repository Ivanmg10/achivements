import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireXboxUser } from '@/lib/apiAuth'
import { findXboxAccount, isGamertag, xboxConfigured, xboxFailure, xboxSummary } from '@/lib/xboxClient'
import { forgetUser } from '@/lib/userRecord'

/**
 * Links an Xbox account by its gamertag. Nothing proves the account is the
 * user's (Xbox has no public sign-in) — it only has to exist and show its
 * games, which is checked here so a hidden profile fails now, not later.
 * Admin-only while Xbox is (requireXboxUser).
 */
export async function POST(req: Request) {
  const auth = await requireXboxUser()
  if (!auth.ok) return auth.response

  if (!xboxConfigured()) return NextResponse.json({ error: 'not-configured' }, { status: 503 })

  let gamertag: unknown
  try {
    gamertag = ((await req.json()) as { gamertag?: unknown })?.gamertag
  } catch {
    return NextResponse.json({ error: 'invalid-gamertag' }, { status: 400 })
  }
  if (!isGamertag(gamertag)) return NextResponse.json({ error: 'invalid-gamertag' }, { status: 400 })

  let account: Awaited<ReturnType<typeof findXboxAccount>>
  try {
    account = await findXboxAccount(gamertag)
    if (!account) return NextResponse.json({ error: 'not-found' }, { status: 404 })
    await xboxSummary(account.xuid, account.gamertag, auth.id)
  } catch (err) {
    return xboxFailure(err, 'xbox/link')
  }

  try {
    await pool.query('UPDATE users SET xboxxuid = $1, xboxgamertag = $2 WHERE id = $3', [account.xuid, account.gamertag, auth.id])
  } catch (err) {
    console.error('[xbox/link] save', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }

  forgetUser(auth.id)
  return NextResponse.json({ xboxxuid: account.xuid, xboxgamertag: account.gamertag })
}
