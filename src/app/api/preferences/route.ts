import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'
import { cleanStoredPreferences, readPreferenceChanges } from '@/utils/syncedPreferences'

/**
 * The account's display preferences (users.preferences), so they follow the
 * person between devices. The keys that may be stored are a fixed list
 * (syncedPreferences); anything else in a request is refused whole.
 */

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

    const { rows } = await pool.query('SELECT preferences FROM users WHERE id = $1', [session.user.id])
    return NextResponse.json({ preferences: cleanStoredPreferences(rows[0]?.preferences) })
  } catch (err) {
    console.error('[preferences GET]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

/** Body: `{ changes: { "<key>": "<value>" | null } }` — a value saves it, null forgets it. */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

    const changes = readPreferenceChanges(await req.json().catch(() => null))
    if (!changes) return NextResponse.json({ message: 'Cambios no válidos' }, { status: 400 })

    const { rows } = await pool.query(
      'UPDATE users SET preferences = (preferences || $1::jsonb) - $2::text[] WHERE id = $3 RETURNING preferences',
      [JSON.stringify(changes.set), changes.remove, session.user.id],
    )
    if (rows.length === 0) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    return NextResponse.json({ preferences: cleanStoredPreferences(rows[0].preferences) })
  } catch (err) {
    console.error('[preferences PUT]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
