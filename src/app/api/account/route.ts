import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { authOptions } from '@/lib/authOptions'
import { checkCurrentPassword } from '@/lib/currentPassword'
import { forgetUser, loadUser } from '@/lib/userRecord'

/**
 * Deletes the signed-in user's own account, and with it everything they own:
 * groups, pins, favourites, Steam cache and reset tokens all cascade from the
 * users row. The session ends by itself, since its row is gone (see the jwt
 * callback in authOptions).
 *
 * It takes the current password, like changing the password or the email: a
 * stolen session alone must not be able to wipe an account.
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const { currentPassword } = ((await req.json().catch(() => null)) ?? {}) as { currentPassword?: unknown }
    const check = await checkCurrentPassword(userId, currentPassword)
    if (check === 'too-many') return NextResponse.json({ error: 'too-many-attempts' }, { status: 429 })
    if (check === 'no-user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (check === 'wrong') return NextResponse.json({ error: 'wrong-password' }, { status: 403 })

    // The site must never be left without anyone who can run it.
    const user = await loadUser(userId)
    if (user?.admin === true) {
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM users WHERE admin = true AND id <> $1', [userId])
      if (!rows[0]?.n) return NextResponse.json({ error: 'last-admin' }, { status: 409 })
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId])
    forgetUser(userId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[account DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
