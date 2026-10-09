import { NextResponse } from 'next/server'
import { dataOwner } from '@/lib/apiAuth'
import { findPublicUser } from '@/lib/publicUser'

/**
 * A CheevoVault user's public profile: who they are and which platforms they
 * have linked. The stats of each platform come from their own routes, so the
 * page can show what it has while the rest loads.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const viewer = await dataOwner()
  if (!viewer) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  try {
    const { username } = await params
    const user = await findPublicUser(username)
    // A private profile looks the same as none to everyone but its owner.
    if (!user || (!user.profilePublic && String(user.id) !== String(viewer.id))) {
      return NextResponse.json({ error: 'not-found' }, { status: 404 })
    }

    return NextResponse.json({
      username: user.username,
      avatar: user.avatar,
      description: user.description,
      location: user.location,
      // Only when it can be read: with the viewer's key, or the owner's own.
      ra: user.rausername && (viewer.raid || user.hasRaKey) ? user.rausername : null,
      steam: Boolean(user.steamid),
      psn: Boolean(user.psnaccountid),
    })
  } catch (err) {
    console.error('[users/[username] GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
