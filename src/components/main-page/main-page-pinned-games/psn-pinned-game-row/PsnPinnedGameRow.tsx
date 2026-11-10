'use client'

import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import GameIcon from '@/components/game-icon/GameIcon'
import { COVER_ROW_IMAGE } from '@/components/game-card-cover/GameCardCover'
import PsnRecentlyPlayedExpanded from '@/components/psn/psn-recently-played-expanded/PsnRecentlyPlayedExpanded'
import { gameHref } from '@/utils/gameRef'
import { psnBackdrop } from '@/utils/psnTitles'
import { GameRowSkeleton } from '@/components/ui/GameRowSkeleton'
import PinnedGameCard from '../pinned-game-card/PinnedGameCard'
import PinnedGameMissing from '../pinned-game-missing/PinnedGameMissing'

/**
 * A pinned PSN game on the home. Game data comes from the shared list, so a pin costs no request of its own.
 */
export default function PsnPinnedGameRow({ gameId, isOpen, onToggle }: { gameId: number; isOpen: boolean; onToggle: () => void }) {
  const { T } = useLanguage()
  const { fullLibrary, libraryLoading } = usePsnGamesData()
  const card = { source: 'psn', gameId, isOpen, onToggle } as const

  const game = fullLibrary.find((g) => g.id === gameId)
  if (!game) {
    // Loading, or a pin for a game no longer in the list (PSN unlinked): a placeholder that can still be unpinned.
    return (
      <PinnedGameCard
        {...card}
        placeholder={
          libraryLoading ? (
            <GameRowSkeleton />
          ) : (
            <PinnedGameMissing source="psn" gameId={gameId} name="PlayStation" logo={<PlaystationLogo size={20} className="text-text-secondary shrink-0" aria-hidden="true" />} />
          )
        }
      />
    )
  }

  return (
    <PinnedGameCard
      {...card}
      view={{
        href: gameHref('psn', gameId),
        title: game.title,
        backdrop: psnBackdrop(game),
        cover: <GameIcon source="psn" id={gameId} imageUrl={game.imageIcon} size={56} className={COVER_ROW_IMAGE} />,
        platform: (
          <>
            <PlaystationLogo size={12} className="opacity-60" aria-hidden="true" />
            {game.consoleName}
          </>
        ),
        progress: { pct: game.pctWon },
        counts: <span>{game.numAwarded}/{game.maxPossible} {T.psn.trophies.toLowerCase()}</span>,
        expand: { show: T.psn.showTrophies, hide: T.psn.hideTrophies },
        panel: <PsnRecentlyPlayedExpanded game={game} />,
      }}
    />
  )
}
