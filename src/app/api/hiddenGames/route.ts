import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'
import { isGameSource } from '@/utils/gameRef'

/**
 * Games the user has hidden from their status lists, RA or Steam. A hidden
 * game is (source, game_id), as RA game ids and Steam appids overlap; title
 * and image are kept so the preferences list can show them as they were.
 */

const MAX_TITLE = 300
const MAX_IMAGE = 500

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

    const { rows } = await pool.query(
      'SELECT source, game_id, title, image FROM hidden_games WHERE user_id = $1 ORDER BY created_at DESC',
      [session.user.id],
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[hiddenGames GET]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const { source, gameId, title, image } = body ?? {}
    if (!isGameSource(source)) return NextResponse.json({ message: 'source debe ser ra o steam' }, { status: 400 })
    if (typeof gameId !== 'number' || !Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ message: 'gameId debe ser un número' }, { status: 400 })
    }
    if (typeof title !== 'string' || !title.trim() || title.length > MAX_TITLE) {
      return NextResponse.json({ message: 'title no válido' }, { status: 400 })
    }
    // Only an https URL or a site path: it is drawn as an image for this user.
    const safeImage =
      typeof image === 'string' && image.length <= MAX_IMAGE && (image.startsWith('https://') || image.startsWith('/')) ? image : null

    await pool.query(
      `INSERT INTO hidden_games (user_id, source, game_id, title, image)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, source, game_id) DO UPDATE SET title = EXCLUDED.title, image = EXCLUDED.image`,
      [session.user.id, source, gameId, title.trim(), safeImage],
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[hiddenGames POST]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

    const source = req.nextUrl.searchParams.get('source')
    const gameId = Number(req.nextUrl.searchParams.get('gameId'))
    if (!isGameSource(source)) return NextResponse.json({ message: 'source debe ser ra o steam' }, { status: 400 })
    if (!Number.isInteger(gameId) || gameId <= 0) return NextResponse.json({ message: 'Falta gameId' }, { status: 400 })

    await pool.query('DELETE FROM hidden_games WHERE user_id = $1 AND source = $2 AND game_id = $3', [session.user.id, source, gameId])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[hiddenGames DELETE]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
