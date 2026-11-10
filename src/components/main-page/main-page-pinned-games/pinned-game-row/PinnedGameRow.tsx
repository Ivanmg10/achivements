'use client'

import Image from 'next/image'
import { useGameProgression } from '@/hooks/useGameProgression'
import { useLanguage } from '@/context/LanguageContext'
import { CONSOLES } from '@/constants'
import { COVER_ROW_IMAGE } from '@/components/game-card-cover/GameCardCover'
import { SectionFallback } from '@/components/ui/SectionFallback'
import RaRecentlyPlayedExpanded from '@/components/recently-played-feed/ra-recently-played-expanded/RaRecentlyPlayedExpanded'
import { GameRowSkeleton } from '@/components/ui/GameRowSkeleton'
import { raImageUrl } from '@/utils/raAssets'
import { raAchievementList } from '@/utils/gameAchievements'
import PinnedGameCard from '../pinned-game-card/PinnedGameCard'

const CONSOLE_BY_ID = new Map(CONSOLES.map((c) => [c.id, c.icon]))

function pct(earned: number, total: number) {
  if (!total) return 0
  return (earned / total) * 100
}

/** A pinned RetroAchievements game on the home: its progression is read for the game (hardcore over softcore). */
export default function PinnedGameRow({
  gameId,
  isOpen,
  onToggle,
}: {
  gameId: number
  isOpen: boolean
  onToggle: () => void
}) {
  const { T } = useLanguage()
  const { game, isLoading, error, refetch } = useGameProgression(String(gameId))
  const card = { source: 'ra', gameId, isOpen, onToggle } as const

  if (error && !game) {
    return (
      <PinnedGameCard
        {...card}
        placeholder={<div className="bg-bg-main rounded-tile h-24 flex"><SectionFallback error onRefresh={refetch}>{null}</SectionFallback></div>}
      />
    )
  }
  if (isLoading || !game) return <PinnedGameCard {...card} placeholder={<GameRowSkeleton />} />

  const achievements = raAchievementList(game).sort((a, b) => a.DisplayOrder - b.DisplayOrder)
  const total = game.NumAchievements ?? 0
  const consoleIcon = game.ConsoleID ? CONSOLE_BY_ID.get(game.ConsoleID) : undefined
  const earned = game.NumAwardedToUser ?? 0
  const earnedHardcore = game.NumAwardedToUserHardcore ?? 0
  const icon = raImageUrl(game.ImageIcon)

  return (
    <PinnedGameCard
      {...card}
      view={{
        href: `/gameInfo/${gameId}`,
        title: game.Title ?? '',
        backdrop: icon ?? null,
        cover: icon ? <Image src={icon} alt="" width={56} height={56} className={`${COVER_ROW_IMAGE} object-cover`} /> : <span aria-hidden="true" className={`${COVER_ROW_IMAGE} bg-ink/10`} />,
        platform: (
          <>
            {consoleIcon && <Image src={consoleIcon} alt="" width={12} height={12} className="w-3 h-3 object-contain opacity-60 shrink-0" />}
            <span className="whitespace-nowrap">{game.ConsoleName}</span>
          </>
        ),
        progress: total > 0 ? { pct: pct(earnedHardcore, total), softPct: pct(earned, total) } : null,
        counts: total > 0 && <span>{earned}/{total} {T.statusGameItem.achievements}</span>,
        expand: { show: T.cards.showAchievements, hide: T.cards.hideAchievements },
        panel: (
          <RaRecentlyPlayedExpanded
            game={{ GameID: gameId, Title: game.Title ?? '', NumAchieved: earned, NumPossibleAchievements: total }}
            achievements={achievements}
            numDistinctPlayers={game.NumDistinctPlayers ?? 1}
            isLoading={false}
          />
        ),
      }}
    />
  )
}
