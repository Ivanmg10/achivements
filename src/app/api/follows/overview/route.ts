import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { authOptions } from '@/lib/authOptions'
import { requireSession } from '@/lib/apiAuth'
import { presenceColumns } from '@/lib/presence'
import { canUseXbox } from '@/utils/xboxAccess'
import { vaultTotalsOrNone } from '@/lib/rankings'

/**
 * The people you follow as the Friends section's cards show them, from our
 * own database only (no platform calls): who they are, whether they are online or when
 * they were last seen (if they share it), where they play (and as whom), their
 * favourite game per platform, their achievement showcase (up to five) and how
 * many public groups they keep. Their pinned achievements are their own goals: never here. Newest follow first; private profiles left out.
 * `?who=followers`: the same for the people who follow you (only you ever see that list).
 */
export async function GET(req?: Request) {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  try {
    // Xbox is admin-only for now: to anyone else it is not there at all (see canUseXbox).
    const xbox = canUseXbox((await getServerSession(authOptions))?.user?.admin)
    // Fixed strings, chosen by the parameter, never taken from it.
    const followers = req ? new URL(req.url).searchParams.get('who') === 'followers' : false
    const [them, you] = followers ? ['f.follower_id', 'f.followed_id'] : ['f.followed_id', 'f.follower_id']
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.avatar, u.location, LEFT(u.description, 120) AS description,
              u.rausername IS NOT NULL AS ra, u.steamid IS NOT NULL AS steam, u.psnaccountid IS NOT NULL AS psn,
              (u.xboxxuid IS NOT NULL AND $2::boolean) AS xbox,
              ${presenceColumns('u')},
              -- The names their accounts go by, as their public profile shows them.
              json_build_object('ra', u.rausername, 'steam', u.steamusername, 'psn', u.psnusername,
                                'xbox', CASE WHEN $2::boolean THEN u.xboxgamertag END) AS accounts,
              json_build_object(
                'ra', CASE WHEN NOT EXISTS (SELECT 1 FROM hidden_games h WHERE h.user_id = u.id AND h.source = 'ra' AND h.game_id = (u.favorite_game->>'id')::int) THEN u.favorite_game END,
                'steam', CASE WHEN NOT EXISTS (SELECT 1 FROM hidden_games h WHERE h.user_id = u.id AND h.source = 'steam' AND h.game_id = (u.favorite_steam_game->>'id')::int) THEN u.favorite_steam_game END,
                'psn', CASE WHEN NOT EXISTS (SELECT 1 FROM hidden_games h WHERE h.user_id = u.id AND h.source = 'psn' AND h.game_id = (u.favorite_psn_game->>'id')::int) THEN u.favorite_psn_game END,
                'xbox', CASE WHEN $2::boolean AND NOT EXISTS (SELECT 1 FROM hidden_games h WHERE h.user_id = u.id AND h.source = 'xbox' AND h.game_id = (u.favorite_xbox_game->>'id')::int) THEN u.favorite_xbox_game END
              ) AS favorites,
              (SELECT COUNT(*) FROM game_groups g WHERE g.user_id = u.id AND g.is_public)::int AS "publicGroups",
              -- Their achievement showcase (earned, chosen, in their order); never their pinned goals.
              COALESCE((
                SELECT json_agg(json_build_object('source', sc.source, 'gameId', sc.game_id, 'gameTitle', sc.game_title,
                                                  'title', sc.title, 'description', sc.description, 'badge', sc.badge)
                                ORDER BY sc.position, sc.created_at)
                FROM showcase_achievements sc
                WHERE sc.user_id = u.id AND ($2::boolean OR sc.source <> 'xbox')
                  AND NOT EXISTS (SELECT 1 FROM hidden_games h WHERE h.user_id = u.id AND h.source = sc.source AND h.game_id = sc.game_id)
              ), '[]'::json) AS showcase,
              COALESCE((SELECT json_agg(h.source || ':' || h.game_id) FROM hidden_games h WHERE h.user_id = u.id), '[]'::json) AS "hiddenGames"
       FROM follows f JOIN users u ON u.id = ${them}
       WHERE ${you} = $1 AND u.profile_public
       ORDER BY f.created_at DESC`,
      [auth.id, xbox],
    )
    // Their Vault Points, for the level on each card; ids stay on the server.
    const vault = await vaultTotalsOrNone(rows.map((r: { id: number }) => r.id), xbox)
    return NextResponse.json(rows.map(({ id, ...r }: { id: number }) => ({ ...r, vaultPoints: vault.get(id) ?? null })))
  } catch (err) {
    console.error('[follows/overview GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
