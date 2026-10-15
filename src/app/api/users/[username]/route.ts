import { NextResponse } from 'next/server'
import { dataOwner } from '@/lib/apiAuth'
import { findPublicUser, hiddenGameKeys } from '@/lib/publicUser'
import { listGroups } from '@/lib/groupList'
import pool from '@/lib/db'
import { canUseXbox } from '@/utils/xboxAccess'

/**
 * A CheevoVault user's public profile: who they are, which platforms they
 * have linked, their preferences and public groups. The stats of each
 * platform come from their own routes, so the page can show what it has while
 * the rest loads. Never the email, the keys or the hash; the gender only when
 * they chose to show it.
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

    // Xbox is admin-only for now: to anyone else it is not there at all.
    const xbox = canUseXbox(viewer.admin)
    const [hiddenGames, groups, follow] = await Promise.all([
      hiddenGameKeys(user.id),
      listGroups(user.id, { publicOnly: true, xbox }),
      pool.query('SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = $2', [viewer.id, user.id]),
    ])

    return NextResponse.json({
      username: user.username,
      avatar: user.avatar,
      description: user.description,
      location: user.location,
      // Only when it can be read: with the viewer's key, or the owner's own.
      ra: user.rausername && (viewer.raid || user.hasRaKey) ? user.rausername : null,
      steam: Boolean(user.steamid),
      psn: Boolean(user.psnaccountid),
      xbox: xbox && Boolean(user.xboxxuid),
      steamName: user.steamid ? user.steamusername : null,
      psnName: user.psnaccountid ? user.psnusername : null,
      xboxName: xbox && user.xboxxuid ? user.xboxgamertag : null,
      isSelf: String(user.id) === String(viewer.id),
      theme: user.theme,
      gender: user.genderPublic ? user.gender : null,
      favorites: { ra: user.favorite_game, steam: user.favorite_steam_game, psn: user.favorite_psn_game, xbox: xbox ? user.favorite_xbox_game : null },
      hiddenGames,
      groups,
      // Whether the viewer follows them, for the Follow button.
      following: follow.rows.length > 0,
    })
  } catch (err) {
    console.error('[users/[username] GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
