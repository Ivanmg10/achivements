import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { clearUserCache } from '@/lib/steamCache'
import { forgetUser } from '@/lib/userRecord'

export async function POST() {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  try {
    await pool.query('UPDATE users SET psnaccountid = NULL, psnusername = NULL WHERE id = $1', [auth.id])
  } catch {
    return NextResponse.json({ message: 'Could not unlink PSN account' }, { status: 500 })
  }

  await clearUserCache(auth.id)
  forgetUser(auth.id)

  return NextResponse.json({ ok: true })
}
