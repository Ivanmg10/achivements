import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { authOptions } from '@/lib/authOptions'
import { isGameSource } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'

/** One favourite per platform, each in its own column. No source means RA. */
const COLUMN: Record<GameSource, string> = {
  ra: 'favorite_game',
  steam: 'favorite_steam_game',
}

function readColumn(value: unknown): string | null {
  if (value === undefined || value === null) return COLUMN.ra
  return isGameSource(value) ? COLUMN[value] : null
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, title, imageIcon, source } = body as {
      id?: number
      title?: string
      imageIcon?: string
      source?: string
    }
    const column = readColumn(source)

    if (!id || !title) return NextResponse.json({ error: 'id and title required' }, { status: 400 })
    if (!column) return NextResponse.json({ error: 'source must be ra or steam' }, { status: 400 })

    const value = JSON.stringify({ id, title, imageIcon: imageIcon ?? '' })
    await pool.query(`UPDATE users SET ${column} = $1 WHERE id = $2`, [value, session.user.id])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[updateFavoriteGame POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const column = readColumn(req.nextUrl.searchParams.get('source'))
    if (!column) return NextResponse.json({ error: 'source must be ra or steam' }, { status: 400 })

    await pool.query(`UPDATE users SET ${column} = NULL WHERE id = $1`, [session.user.id])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[updateFavoriteGame DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
