import pool from '@/lib/db'
import type { GameGroup } from '@/types/types'

/**
 * A user's groups as the group cards show them: counts, progress and the
 * first four covers. `publicOnly` is for someone else's profile.
 */
export async function listGroups(
  userId: string | number,
  { publicOnly = false, xbox = true }: { publicOnly?: boolean; xbox?: boolean } = {},
): Promise<GameGroup[]> {
  const { rows } = await pool.query(
    `SELECT g.id, g.title, g.description, g.icon, g.is_public, g.position, g.created_at, g.updated_at,
            COUNT(i.id)::int                                          AS game_count,
            COUNT(i.id) FILTER (WHERE i.source = 'steam')::int        AS steam_count,
            COUNT(i.id) FILTER (WHERE i.source = 'psn')::int          AS psn_count,
            COUNT(i.id) FILTER (WHERE i.source = 'xbox')::int         AS xbox_count,
            COALESCE(SUM(i.num_awarded), 0)::int    AS total_awarded,
            COALESCE(SUM(i.max_possible), 0)::int   AS total_possible,
            -- The first four games' art, for the card's cover mosaic.
            COALESCE((
              SELECT json_agg(json_build_object('source', c.source, 'game_id', c.game_id, 'image_icon', c.image_icon) ORDER BY c.position)
                FROM (SELECT source, game_id, image_icon, position FROM game_group_items
                       WHERE group_id = g.id AND ($2::boolean OR source <> 'xbox') ORDER BY position LIMIT 4) c
            ), '[]'::json) AS covers
     FROM game_groups g
     LEFT JOIN game_group_items i ON i.group_id = g.id AND ($2::boolean OR i.source <> 'xbox')
     WHERE g.user_id = $1${publicOnly ? ' AND g.is_public' : ''}
     GROUP BY g.id
     ORDER BY g.position ASC, g.created_at ASC`,
    // Xbox games are admin-only for now: whoever may not see them gets groups without them (see canUseXbox).
    [userId, xbox],
  )
  return rows as GameGroup[]
}
