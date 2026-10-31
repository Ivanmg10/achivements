import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { authOptions } from '@/lib/authOptions'
import { avatarPath, parseAvatarSegment } from '@/lib/avatarImage'

/**
 * An uploaded avatar. Any signed-in user may see the current picture of a
 * public profile, which they can search for and open; a private profile's only
 * its owner and admins (the panel lists it). Signed out gets a 401.
 *
 * Served as the raster type its bytes were checked to be on upload, with
 * nosniff, so a browser never reads it as anything else; the site-wide CSP
 * from next.config applies on top (a CSP set here would be replaced by it).
 * Cached for good: a new upload has a new URL.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  try {
    const { file } = await params
    const ownerId = parseAvatarSegment(file)
    if (ownerId === null) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const session = await getServerSession(authOptions)
    const viewerId = session?.user?.id
    if (!viewerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { rows } = await pool.query(
      `SELECT a.image, a.mime FROM user_avatars a JOIN users u ON u.id = a.user_id
       WHERE a.user_id = $1 AND u.avatar = $2 AND (u.profile_public OR u.id = $3 OR $4::boolean)`,
      [ownerId, avatarPath(file), viewerId, session.user.admin === true],
    )
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return new NextResponse(rows[0].image, {
      headers: {
        'Content-Type': rows[0].mime,
        'Cache-Control': 'private, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[avatar GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
