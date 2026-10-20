import { NextResponse, after } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { refreshScoreIfStale } from '@/lib/scoreRefresh'

/** Room for the score refresh that runs after the answer (refreshScoreIfStale gives itself 25 s). */
export const maxDuration = 60

/**
 * The heartbeat: the signed-in user has CheevoVault open in front of them
 * (usePresenceHeartbeat sends it while the tab is visible). Written at most
 * once a minute per user, whatever the client sends. Whether others are told
 * is the user's choice (`show_presence`), read where it is shown.
 *
 * It is also what keeps the Vault Points of whoever is on the site fresh:
 * after answering, their score is refreshed when it is older than six hours.
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
    after(() => refreshScoreIfStale(auth.id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[presence POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
