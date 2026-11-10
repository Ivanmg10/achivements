'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/context/LanguageContext'
import type { RetroAchievement, RetroAchievementsGameWithAchievements } from '@/types/types'
import type { AchievementColumn } from '@/types/achievementTable'
import { useRaFavoriteIds } from '@/hooks/useRaFavoriteIds'
import { raAchievementList } from '@/utils/gameAchievements'
import { raCompareItem } from '@/utils/gameCompare'
import AchievementTable from '@/components/achievement-table/AchievementTable'
import { raTypeTag, TYPE_TAG } from '@/components/ui/dataTable'

// Downloaded the first time it opens, not with the page.
const AchievementModal = dynamic(() => import('../achievement-modal/AchievementModal'), { loading: () => null })

/**
 * An RA game's achievements on the shared table: players, hardcore players and
 * points as columns, each one's type beside its name (missable in red), the
 * missables still to earn in a line on top, the star beside the name, and RA's
 * own detail window.
 */
export default function GameInfoTable({ gameData }: { gameData?: RetroAchievementsGameWithAchievements | null }) {
  const { T, lang } = useLanguage()
  const players = gameData?.NumDistinctPlayers ?? 1
  const { favoritedIds, leadingIds, toggleFavorite } = useRaFavoriteIds(gameData?.ID)
  const items = useMemo(() => (gameData ? raAchievementList(gameData).sort((a, b) => a.DisplayOrder - b.DisplayOrder) : []), [gameData])
  const toRow = useMemo(() => raCompareItem(players), [players])
  const toggle = (a: RetroAchievement) => toggleFavorite(a, { gameTitle: gameData?.Title, numDistinctPlayers: players })
  const count = (key: string, label: string, value: (a: RetroAchievement) => number, className = ''): AchievementColumn<RetroAchievement> => ({
    key,
    label,
    align: 'right',
    width: 'w-32',
    sort: { first: 'desc', value: ({ item }) => value(item) },
    cell: ({ item }) => <span className={className}>{value(item).toLocaleString(lang)}</span>,
  })
  const points: AchievementColumn<RetroAchievement> = {
    key: 'points',
    label: T.gameInfoTable.headerPoints,
    align: 'right',
    width: 'w-24',
    end: true,
    sort: { first: 'desc', value: ({ item }) => item.Points },
    cell: ({ item }) => <span className="text-base font-extrabold">{item.Points}</span>,
    card: ({ item }) => <span className="font-semibold text-text-main">{item.Points} {T.libraryDetail.pointsShort}</span>,
  }
  const typeTag = ({ item }: { item: RetroAchievement }) => {
    const tag = raTypeTag(item.Type, T.achievement)
    return tag && <span className={`${TYPE_TAG} ${tag.className}`}>{tag.label}</span>
  }

  return (
    <AchievementTable
      source="ra"
      gameId={gameData?.ID ?? 0}
      gameTitle={gameData?.Title ?? ''}
      items={items}
      toRow={toRow}
      texts={{
        label: T.gameInfoPage.achievements,
        name: T.gameInfoTable.headerAchievement,
        none: T.gameInfoTable.noMatches,
        earned: T.gameInfoTable.headerEarned,
        locked: T.achievementDetail.notEarned,
      }}
      pins={{ canPin: true, isPinned: (a) => favoritedIds.has(a.ID), leads: (a) => leadingIds.has(a.ID), toggle }}
      columns={[
        count('players', T.gameInfoTable.headerPlayers, (a) => a.NumAwarded),
        count('hc', T.gameInfoTable.headerHC, (a) => a.NumAwardedHardcore, 'text-text-secondary'),
        points,
      ]}
      sortMenu={['points', 'rarity', 'players', 'earned']}
      tags={typeTag}
      notice={{ match: ({ item, row }) => item.Type === 'missable' && !row.earned }}
      detail={{
        render: (a, { pinned, onTogglePin, onClose }) => (
          <AchievementModal
            achievement={a}
            numDistinctPlayers={players}
            onClose={onClose}
            gameId={gameData?.ID}
            gameTitle={gameData?.Title}
            isFavorited={pinned}
            onToggleFavorite={onTogglePin}
          />
        ),
      }}
      pinInTitle
    />
  )
}
