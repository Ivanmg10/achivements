import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireXboxUser } from '@/lib/apiAuth'
import { clearUserCache } from '@/lib/steamCache'
import { forgetUser } from '@/lib/userRecord'

export async function POST() {
  const auth = await requireXboxUser()
  if (!auth.ok) return auth.response

  try {
    await pool.query('UPDATE users SET xboxxuid = NULL, xboxgamertag = NULL WHERE id = $1', [auth.id])
  } catch (err) {
    console.error('[xbox/unlink]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }

  await clearUserCache(auth.id)
  forgetUser(auth.id)

  return NextResponse.json({ ok: true })
}
