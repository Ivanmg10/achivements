'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import FeedGameCard from '@/components/feed-game-card/FeedGameCard'
import FeedGameCardPlaytime from '@/components/feed-game-card/feed-game-card-playtime/FeedGameCardPlaytime'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import SteamRecentlyPlayedExpanded from '@/components/steam/steam-recently-played-expanded/SteamRecentlyPlayedExpanded'
import { steamAssetUrl } from '@/lib/steamAssets'
import { formatDate } from '@/utils/dates'
import { gameHref } from '@/utils/gameRef'
import type { SteamGameProgress } from '@/types/steam'

/**
 * One Steam game as a row in the recent feed. Deliberately absent, because Steam has no equivalent:
 * hardcore/softcore split, points, console. Play time appears instead. Its counts come in a second
 * step, so until they are loaded the row says the progress is unknown, with no bar.
 */
export default function SteamGameItem({
  game,
  expanded,
  onToggle,
  className,
}: {
  game: SteamGameProgress
  expanded?: boolean
  onToggle?: () => void
  /** Extra classes for the root, e.g. to fill a flex slot in the recent feed. */
  className?: string
}) {
  const subject = useSubject()
  const { T, lang } = useLanguage()
  const hasCounts = game.achievementsLoaded && game.maxPossible > 0
  const perfect = hasCounts && game.numAwarded >= game.maxPossible

  let progressText: string
  if (hasCounts) progressText = `${game.numAwarded}/${game.maxPossible} ${T.steam.achievements}`
  else if (!game.hasStats) progressText = T.steam.noAchievements
  else progressText = T.steam.progressUnknown

  return (
    <FeedGameCard
      href={gameHref('steam', game.id, subject)}
      title={game.title}
      backdrop={steamAssetUrl(game.id, 'header')}
      icon={(cls) => <SteamGameImage appId={game.id} asset="icon" iconUrl={game.imageIcon} size={56} className={cls} />}
      ring={perfect ? 'warning' : undefined}
      platform={{ source: 'steam', label: 'Steam' }}
      progress={hasCounts ? { pct: game.pctWon, percent: Math.round(game.pctWon), done: perfect } : null}
      facts={[
        <span key="a" className="whitespace-nowrap">{progressText}</span>,
        <FeedGameCardPlaytime key="h" minutes={game.playtimeForever} />,
        game.lastPlayed && <span key="d">{formatDate(game.lastPlayed, lang)}</span>,
      ]}
      expand={{ show: T.cards.showAchievements, hide: T.cards.hideAchievements }}
      pin={{ gameId: game.id, source: 'steam' }}
      expanded={expanded}
      onToggle={onToggle}
      className={className}
    >
      {game.hasStats ? <SteamRecentlyPlayedExpanded game={game} /> : <p className="text-sm text-text-secondary">{T.steam.noAchievements}</p>}
    </FeedGameCard>
  )
}
