'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import FeedGameCard from '@/components/feed-game-card/FeedGameCard'
import FeedGameCardPlaytime from '@/components/feed-game-card/feed-game-card-playtime/FeedGameCardPlaytime'
import GameIcon from '@/components/game-icon/GameIcon'
import PsnRecentlyPlayedExpanded from '@/components/psn/psn-recently-played-expanded/PsnRecentlyPlayedExpanded'
import { formatDate } from '@/utils/dates'
import { gameHref } from '@/utils/gameRef'
import { psnBackdrop } from '@/utils/psnTitles'
import type { PsnGameProgress } from '@/types/psn'

/**
 * One PSN game as a row in the recent feed: its trophies "x/y", a platinum mark, and play time where
 * Sony reports it (PS4/PS5 games). Opened, it shows its trophies.
 */
export default function PsnGameItem({
  game,
  expanded,
  onToggle,
  className,
}: {
  game: PsnGameProgress
  expanded?: boolean
  onToggle?: () => void
  className?: string
}) {
  const subject = useSubject()
  const { T, lang } = useLanguage()
  const perfect = game.pctWon >= 100

  return (
    <FeedGameCard
      href={gameHref('psn', game.id, subject)}
      title={game.title}
      backdrop={psnBackdrop(game)}
      icon={(cls) => <GameIcon source="psn" id={game.id} imageUrl={game.imageIcon} size={64} className={cls} />}
      ring={perfect ? 'platinum' : undefined}
      platform={{ source: 'psn', label: game.consoleName }}
      progress={{ pct: game.pctWon, percent: game.pctWon, done: perfect }}
      facts={[
        <span key="t" className="whitespace-nowrap">{game.numAwarded}/{game.maxPossible} {T.psn.trophies.toLowerCase()}</span>,
        game.earned.platinum > 0 && <span key="p" className="text-platinum">{T.psn.platinum}</span>,
        game.playtimeMinutes !== null && <FeedGameCardPlaytime key="h" minutes={game.playtimeMinutes} />,
        game.lastPlayed && <span key="d">{formatDate(game.lastPlayed, lang)}</span>,
      ]}
      expand={{ show: T.psn.showTrophies, hide: T.psn.hideTrophies }}
      pin={{ gameId: game.id, source: 'psn' }}
      expanded={expanded}
      onToggle={onToggle}
      className={className}
    >
      <PsnRecentlyPlayedExpanded game={game} />
    </FeedGameCard>
  )
}
