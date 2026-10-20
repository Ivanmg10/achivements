import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'

/**
 * How many you follow and how many follow you, counting the public profiles
 * only, as the two lists on the Following page show them.
 */
export async function GET() {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  try {
    const { rows } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM follows f JOIN users u ON u.id = f.followed_id
           WHERE f.follower_id = $1 AND u.profile_public)::int AS following,
         (SELECT COUNT(*) FROM follows f JOIN users u ON u.id = f.follower_id
           WHERE f.followed_id = $1 AND u.profile_public)::int AS followers`,
      [auth.id],
    )
    return NextResponse.json(rows[0])
  } catch (err) {
    console.error('[follows/count GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
