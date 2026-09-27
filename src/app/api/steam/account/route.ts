import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'

/**
 * The linked Steam account as stored in the DB. The OpenID callback is a
 * redirect, so it cannot write the JWT cookie — the client reads the link back
 * through here and pushes it into the session via next-auth's update().
 */
export async function GET() {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  try {
    const result = await pool.query(
      'SELECT steamid, steamusername FROM users WHERE id = $1',
      [auth.id],
    )
    const row = result.rows[0]
    if (!row) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    return NextResponse.json({
      steamid: row.steamid ?? null,
      steamusername: row.steamusername ?? null,
    })
  } catch {
    return NextResponse.json({ message: 'Could not read Steam account' }, { status: 500 })
  }
}
