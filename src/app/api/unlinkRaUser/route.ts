import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { authOptions } from '@/lib/authOptions'
import { forgetUser } from '@/lib/userRecord'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  try {
    await pool.query(
      `UPDATE users SET "raUser" = NULL, rausername = NULL, raid = NULL WHERE id = $1`,
      [session.user.id],
    )
  } catch (err) {
    console.error('[unlinkRaUser]', err)
    return NextResponse.json({ message: 'Could not unlink RA account' }, { status: 500 })
  }

  forgetUser(session.user.id)
  return NextResponse.json({ ok: true })
}
