import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'
import { listGroups } from '@/lib/groupList'
import { GROUPS_PER_USER_MAX, readGroupFields } from '@/utils/groupValidation'
import { canUseXbox } from '@/utils/xboxAccess'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    return NextResponse.json(await listGroups(session.user.id, { xbox: canUseXbox(session.user.admin) }))
  } catch (err) {
    console.error('[groups GET]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const fields = readGroupFields(await req.json().catch(() => null))
    if (!fields.ok) return NextResponse.json({ message: fields.message }, { status: 400 })
    const { title, description, icon, is_public } = fields.value

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM game_groups WHERE user_id = $1',
      [session.user.id],
    )
    if (parseInt(countRes.rows[0].count) >= GROUPS_PER_USER_MAX) {
      return NextResponse.json({ message: `Máximo ${GROUPS_PER_USER_MAX} grupos permitidos` }, { status: 400 })
    }

    const posRes = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM game_groups WHERE user_id = $1',
      [session.user.id],
    )
    const position = posRes.rows[0].next

    const result = await pool.query(
      `INSERT INTO game_groups (user_id, title, description, icon, is_public, position)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, description, icon, is_public, position, created_at, updated_at`,
      [session.user.id, title, description, icon, is_public, position],
    )

    return NextResponse.json({ ...result.rows[0], game_count: 0, steam_count: 0, psn_count: 0, xbox_count: 0 }, { status: 201 })
  } catch (err) {
    console.error('[groups POST]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
