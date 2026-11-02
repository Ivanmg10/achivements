import pool from '@/lib/db'
import type { GameGroup } from '@/types/types'

/**
 * A user's groups as the group cards show them: counts, progress, the first
 * five games (covers and progress) and the started game closest to done. `publicOnly` is for someone else's profile.
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
            COUNT(i.id) FILTER (WHERE i.max_possible > 0 AND i.num_awarded >= i.max_possible)::int AS completed_count,
            COUNT(i.id) FILTER (WHERE i.num_awarded > 0 AND i.num_awarded < i.max_possible)::int   AS started_count,
            -- The first five games, for the covers and the shelf.
            COALESCE((
              SELECT json_agg(json_build_object('source', c.source, 'game_id', c.game_id, 'image_icon', c.image_icon,
                                                'title', c.title, 'num_awarded', c.num_awarded, 'max_possible', c.max_possible) ORDER BY c.position)
                FROM (SELECT source, game_id, image_icon, title, num_awarded, max_possible, position FROM game_group_items
                       WHERE group_id = g.id AND ($2::boolean OR source <> 'xbox')
                         AND NOT EXISTS (SELECT 1 FROM hidden_games h WHERE h.user_id = g.user_id AND h.source = game_group_items.source AND h.game_id = game_group_items.game_id)
                       ORDER BY position LIMIT 5) c
            ), '[]'::json) AS covers,
            -- The started, unfinished game with the largest share earned.
            (SELECT json_build_object('title', n.title, 'left', n.max_possible - n.num_awarded)
               FROM game_group_items n
              WHERE n.group_id = g.id AND ($2::boolean OR n.source <> 'xbox')
                AND NOT EXISTS (SELECT 1 FROM hidden_games h WHERE h.user_id = g.user_id AND h.source = n.source AND h.game_id = n.game_id)
                AND n.num_awarded > 0 AND n.num_awarded < n.max_possible
              ORDER BY n.num_awarded::float / n.max_possible DESC, n.position LIMIT 1) AS next_up
     FROM game_groups g
     LEFT JOIN game_group_items i ON i.group_id = g.id AND ($2::boolean OR i.source <> 'xbox')
       AND NOT EXISTS (SELECT 1 FROM hidden_games h WHERE h.user_id = g.user_id AND h.source = i.source AND h.game_id = i.game_id)
     WHERE g.user_id = $1${publicOnly ? ' AND g.is_public' : ''}
     GROUP BY g.id
     ORDER BY g.position ASC, g.created_at ASC`,
    // Xbox games are admin-only for now: whoever may not see them gets groups without them (see canUseXbox).
    [userId, xbox],
  )
  return rows as GameGroup[]
}
