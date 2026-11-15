import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { forgetUser } from '@/lib/userRecord'

/**
 * DELETE ?id=<user>: clears a user's PSN verification, for a dispute (someone else owns the account, or it was
 * verified by mistake). The link stays; the user can verify again, and so can anyone else once it is free (#176).
 */
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return auth.response

    const id = new URL(req.url).searchParams.get('id') ?? ''
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'A numeric id is required' }, { status: 400 })

    const { rows } = await pool.query(
      `UPDATE users SET psn_verified_at = NULL, psn_verification_code = NULL, psn_verification_expires_at = NULL
       WHERE id = $1 RETURNING id, username, psnaccountid`,
      [id],
    )
    if (!rows[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    forgetUser(rows[0].id)
    await logAdminAction(auth.admin, 'clear-psn-verification', rows[0], { psnaccountid: rows[0].psnaccountid })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/users/psnVerification DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
