import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'

/**
 * The people you follow as the Friends section's cards show them, from our
 * own database only (no platform calls): who they are, where they play, their
 * favourite game per platform, their three latest pinned achievements and how
 * many public groups they keep. Newest follow first; private profiles left out.
 */
export async function GET() {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  try {
    const { rows } = await pool.query(
      `SELECT u.username, u.avatar, u.location, LEFT(u.description, 120) AS description,
              u.rausername IS NOT NULL AS ra, u.steamid IS NOT NULL AS steam, u.psnaccountid IS NOT NULL AS psn,
              json_build_object('ra', u.favorite_game, 'steam', u.favorite_steam_game, 'psn', u.favorite_psn_game) AS favorites,
              (SELECT COUNT(*) FROM game_groups g WHERE g.user_id = u.id AND g.is_public)::int AS "publicGroups",
              COALESCE((
                SELECT json_agg(p ORDER BY p.created_at DESC) FROM (
                  SELECT source, game_id AS "gameId", game_title AS "gameTitle", created_at,
                         COALESCE(snapshot->>'Title', snapshot->>'title', snapshot->>'name') AS title,
                         CASE source
                           WHEN 'ra' THEN 'https://media.retroachievements.org/Badge/' || (snapshot->>'BadgeName') || '.png'
                           WHEN 'steam' THEN snapshot->>'badgeUrl'
                           ELSE snapshot->>'iconUrl'
                         END AS badge
                  FROM pinned_achievements WHERE user_id = u.id
                  ORDER BY created_at DESC LIMIT 3
                ) p
              ), '[]'::json) AS pins
       FROM follows f JOIN users u ON u.id = f.followed_id
       WHERE f.follower_id = $1 AND u.profile_public
       ORDER BY f.created_at DESC`,
      [auth.id],
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[follows/overview GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
