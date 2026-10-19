import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'

/**
 * The heartbeat: the signed-in user has CheevoVault open in front of them
 * (usePresenceHeartbeat sends it while the tab is visible). Written at most
 * once a minute per user, whatever the client sends. Whether others are told
 * is the user's choice (`show_presence`), read where it is shown.
 */
export async function POST() {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  try {
    await pool.query(
      `UPDATE users SET last_seen_at = now()
       WHERE id = $1 AND (last_seen_at IS NULL OR last_seen_at < now() - interval '1 minute')`,
      [auth.id],
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[presence POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
