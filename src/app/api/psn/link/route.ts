import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { findPsnAccount, psnConfigured, psnFailure, psnSummary } from '@/lib/psnClient'
import { forgetUser } from '@/lib/userRecord'

/** PSN online IDs: 3–16 letters, digits, hyphens or underscores. */
const ONLINE_ID = /^[A-Za-z0-9_-]{3,16}$/

/**
 * Links a PSN account by its username. Nothing proves the account is the
 * user's (Sony has no public sign-in) — it only has to exist and show its
 * trophies, which is checked here so a private profile fails now, not later.
 */
export async function POST(req: Request) {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  if (!(await psnConfigured())) return NextResponse.json({ error: 'not-configured' }, { status: 503 })

  let username: unknown
  try {
    username = ((await req.json()) as { username?: unknown })?.username
  } catch {
    return NextResponse.json({ error: 'invalid-username' }, { status: 400 })
  }
  if (typeof username !== 'string' || !ONLINE_ID.test(username.trim())) {
    return NextResponse.json({ error: 'invalid-username' }, { status: 400 })
  }

  let account: { accountId: string; onlineId: string } | null
  try {
    account = await findPsnAccount(username.trim())
    if (!account) return NextResponse.json({ error: 'not-found' }, { status: 404 })
    await psnSummary(account.accountId, auth.id)
  } catch (err) {
    return psnFailure(err, 'psn/link')
  }

  try {
    await pool.query('UPDATE users SET psnaccountid = $1, psnusername = $2 WHERE id = $3', [
      account.accountId,
      account.onlineId,
      auth.id,
    ])
  } catch (err) {
    console.error('[psn/link] save', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }

  forgetUser(auth.id)
  return NextResponse.json({ psnaccountid: account.accountId, psnusername: account.onlineId })
}
