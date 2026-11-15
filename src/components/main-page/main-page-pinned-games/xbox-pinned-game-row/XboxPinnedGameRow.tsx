'use client'

import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import GameIcon from '@/components/game-icon/GameIcon'
import { COVER_ROW_IMAGE } from '@/components/game-card-cover/GameCardCover'
import XboxRecentlyPlayedExpanded from '@/components/xbox/xbox-recently-played-expanded/XboxRecentlyPlayedExpanded'
import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import { gameHref } from '@/utils/gameRef'
import { xboxBackdrop } from '@/utils/xboxTitles'
import { GameRowSkeleton } from '@/components/ui/GameRowSkeleton'
import PinnedGameCard from '../pinned-game-card/PinnedGameCard'
import PinnedGameMissing from '../pinned-game-missing/PinnedGameMissing'

/**
 * A pinned Xbox game on the home. Game data comes from the shared library, so a pin costs no request of
 * its own (and Xbox's budget is 150 calls an hour for the whole app).
 */
export default function XboxPinnedGameRow({ gameId, isOpen, onToggle }: { gameId: number; isOpen: boolean; onToggle: () => void }) {
  const { T } = useLanguage()
  const { fullLibrary, libraryLoading } = useXboxGamesData()
  const card = { source: 'xbox', gameId, isOpen, onToggle } as const

  const game = fullLibrary.find((g) => g.id === gameId)
  if (!game) {
    // Loading, or a pin for a game no longer in the library (Xbox unlinked): a placeholder that can still be unpinned.
    return (
      <PinnedGameCard
        {...card}
        placeholder={
          libraryLoading ? (
            <GameRowSkeleton />
          ) : (
            <PinnedGameMissing source="xbox" gameId={gameId} name="Xbox" logo={<XboxLogo size={20} className="text-text-secondary shrink-0" aria-hidden="true" />} />
          )
        }
      />
    )
  }

  const noun = T.xbox.achievements.toLowerCase()
  return (
    <PinnedGameCard
      {...card}
      view={{
        href: gameHref('xbox', gameId),
        title: game.title,
        backdrop: xboxBackdrop(game),
        cover: <GameIcon source="xbox" id={gameId} imageUrl={game.imageIcon} size={56} className={COVER_ROW_IMAGE} />,
        platform: (
          <>
            <XboxLogo size={12} className="opacity-60" aria-hidden="true" />
            {game.consoleName}
          </>
        ),
        progress: { pct: game.pctWon },
        counts: (
          <>
            <span>{game.totalKnown ? `${game.numAwarded}/${game.maxPossible} ${noun}` : `${game.numAwarded} ${noun}`}</span>
            <XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} />
          </>
        ),
        expand: { show: T.xbox.showAchievements, hide: T.xbox.hideAchievements },
        panel: <XboxRecentlyPlayedExpanded game={game} />,
      }}
    />
  )
}
