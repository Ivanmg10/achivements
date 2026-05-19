import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { authOptions } from '@/lib/authOptions'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  await pool.query(
    `UPDATE users SET "raUser" = NULL, rausername = NULL, raid = NULL WHERE id = $1`,
    [session.user.id],
  )

  return NextResponse.json({ ok: true })
}
