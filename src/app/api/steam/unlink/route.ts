import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { clearUserCache } from '@/lib/steamCache'

export async function POST() {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  try {
    await pool.query(
      'UPDATE users SET steamid = NULL, steamusername = NULL WHERE id = $1',
      [auth.id],
    )
  } catch {
    return NextResponse.json({ message: 'Could not unlink Steam account' }, { status: 500 })
  }

  // Best effort: the link is already gone, so a stale cache row must not fail the request.
  await clearUserCache(auth.id)

  return NextResponse.json({ ok: true })
}
