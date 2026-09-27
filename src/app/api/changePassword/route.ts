import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcrypt'
import { authOptions } from '@/lib/authOptions'
import { checkCurrentPassword } from '@/lib/currentPassword'
import { forgetUser } from '@/lib/userRecord'
import { BCRYPT_COST, PASSWORD_MIN } from '@/utils/authValidation'

/**
 * Changes the signed-in user's password. The new hash ends every session,
 * this one included (see authOptions' jwt callback), so whoever might hold a
 * stolen one is out; the client signs in again.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = (await req.json()) as { currentPassword?: unknown; newPassword?: unknown }

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'missing-fields' }, { status: 400 })
    }
    if (typeof newPassword !== 'string' || newPassword.length < PASSWORD_MIN) {
      return NextResponse.json({ error: 'weak-password' }, { status: 400 })
    }

    const check = await checkCurrentPassword(session.user.id, currentPassword)
    if (check === 'too-many') return NextResponse.json({ error: 'too-many-attempts' }, { status: 429 })
    if (check === 'no-user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (check === 'wrong') return NextResponse.json({ error: 'wrong-password' }, { status: 403 })

    const hashed = await bcrypt.hash(newPassword, BCRYPT_COST)
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, session.user.id])
    forgetUser(session.user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[changePassword POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
