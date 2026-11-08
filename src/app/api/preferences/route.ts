import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import pool from '@/lib/db'
import { readPreferences } from '@/lib/meBootstrap'
import { cleanStoredPreferences, readPreferenceChanges } from '@/utils/syncedPreferences'

/**
 * The account's display preferences (users.preferences), so they follow the
 * person between devices. The keys that may be stored are a fixed list
 * (syncedPreferences); anything else in a request is refused whole.
 */

export async function GET() {
  try {
    const auth = await requireSession()
    if (!auth.ok) return auth.response

    return NextResponse.json({ preferences: await readPreferences(auth.id) })
  } catch (err) {
    console.error('[preferences GET]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

/** Body: `{ changes: { "<key>": "<value>" | null } }` — a value saves it, null forgets it. */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireSession()
    if (!auth.ok) return auth.response

    const changes = readPreferenceChanges(await req.json().catch(() => null))
    if (!changes) return NextResponse.json({ message: 'Cambios no válidos' }, { status: 400 })

    const { rows } = await pool.query(
      'UPDATE users SET preferences = (preferences || $1::jsonb) - $2::text[] WHERE id = $3 RETURNING preferences',
      [JSON.stringify(changes.set), changes.remove, auth.id],
    )
    if (rows.length === 0) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    return NextResponse.json({ preferences: cleanStoredPreferences(rows[0].preferences) })
  } catch (err) {
    console.error('[preferences PUT]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
