'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import FeedGameCard from '@/components/feed-game-card/FeedGameCard'
import FeedGameCardPlaytime from '@/components/feed-game-card/feed-game-card-playtime/FeedGameCardPlaytime'
import GameIcon from '@/components/game-icon/GameIcon'
import XboxRecentlyPlayedExpanded from '@/components/xbox/xbox-recently-played-expanded/XboxRecentlyPlayedExpanded'
import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import { formatDate } from '@/utils/dates'
import { gameHref } from '@/utils/gameRef'
import { xboxBackdrop } from '@/utils/xboxTitles'
import type { XboxGameProgress } from '@/types/xbox'

/**
 * One Xbox game as a row in the recent feed: its achievements (the total is left out when Xbox does
 * not say it), its gamerscore and play time. Opened, it shows its achievements.
 */
export default function XboxGameItem({
  game,
  expanded,
  onToggle,
  className,
}: {
  game: XboxGameProgress
  expanded?: boolean
  onToggle?: () => void
  className?: string
}) {
  const subject = useSubject()
  const { T, lang } = useLanguage()
  const perfect = game.pctWon >= 100
  const progressText = game.totalKnown
    ? T.xbox.achievementsProgress.replace('{earned}', String(game.numAwarded)).replace('{total}', String(game.maxPossible))
    : T.xbox.achievementsEarned.replace('{earned}', String(game.numAwarded))

  return (
    <FeedGameCard
      href={gameHref('xbox', game.id, subject)}
      title={game.title}
      backdrop={xboxBackdrop(game)}
      icon={(cls) => <GameIcon source="xbox" id={game.id} imageUrl={game.imageIcon} size={64} className={cls} />}
      ring={perfect ? 'success' : undefined}
      platform={{ source: 'xbox', label: game.consoleName }}
      progress={{ pct: game.pctWon, percent: game.pctWon, done: perfect }}
      facts={[
        <span key="a" className="whitespace-nowrap">{progressText}</span>,
        <XboxGamerscore key="g" earned={game.earnedGamerscore} total={game.totalGamerscore} />,
        game.playtimeMinutes !== null && <FeedGameCardPlaytime key="h" minutes={game.playtimeMinutes} />,
        game.lastPlayed && <span key="d">{formatDate(game.lastPlayed, lang)}</span>,
      ]}
      expand={{ show: T.xbox.showAchievements, hide: T.xbox.hideAchievements }}
      pin={{ gameId: game.id, source: 'xbox' }}
      expanded={expanded}
      onToggle={onToggle}
      className={className}
    >
      <XboxRecentlyPlayedExpanded game={game} />
    </FeedGameCard>
  )
}
