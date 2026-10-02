import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireAdmin } from '@/lib/adminAuth'

const LIMIT = 100

/** The latest admin actions, newest first, for the panel. */
export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return auth.response

    const { rows } = await pool.query(
      `SELECT id, admin_id, admin_username, target_user_id, target_username, action, detail, created_at
         FROM admin_actions
        ORDER BY created_at DESC, id DESC
        LIMIT $1`,
      [LIMIT],
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[admin/actions GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
