import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import pool from '@/lib/db'
import { clearUserCache } from '@/lib/steamCache'
import { forgetUser } from '@/lib/userRecord'

export async function POST() {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  try {
    await pool.query(
      `UPDATE users SET "raUser" = NULL, rausername = NULL, raid = NULL, raid_hash = NULL WHERE id = $1`,
      [auth.id],
    )
  } catch (err) {
    console.error('[unlinkRaUser]', err)
    return NextResponse.json({ message: 'Could not unlink RA account' }, { status: 500 })
  }

  await clearUserCache(auth.id)
  forgetUser(auth.id)
  return NextResponse.json({ ok: true })
}
