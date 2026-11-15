'use client'

import type { PsnCollection, PsnGameProgress } from '@/types/psn'
import { useLanguage } from '@/context/LanguageContext'
import { formatDate } from '@/utils/dates'
import { psnBackdrop } from '@/utils/psnTitles'
import FeedGameCard from '@/components/feed-game-card/FeedGameCard'
import FeedGameCardPlaytime from '@/components/feed-game-card/feed-game-card-playtime/FeedGameCardPlaytime'
import GameIcon from '@/components/game-icon/GameIcon'
import PsnCollectionExpanded from '@/components/psn/psn-collection-expanded/PsnCollectionExpanded'

/**
 * A collection (The Ezio Collection) in the recent feed: one row with the collection's session, hours
 * and icon, since Sony does not say which of its games was played. Opened, it is laid out like an
 * opened game, with each of its games as a fold of trophies (as a game's DLC). It has no page or pin
 * of its own, so the whole row opens: those stay per game.
 */
export default function PsnCollectionItem({
  collection,
  games,
  expanded,
  onToggle,
  className,
}: {
  collection: PsnCollection
  games: PsnGameProgress[]
  expanded?: boolean
  onToggle?: () => void
  className?: string
}) {
  const { T, lang } = useLanguage()
  const awarded = games.reduce((sum, g) => sum + g.numAwarded, 0)
  const total = games.reduce((sum, g) => sum + g.maxPossible, 0)
  const pct = total > 0 ? Math.round((awarded / total) * 100) : 0
  const consoles = [...new Set(games.map((g) => g.consoleName))].join(' · ')
  const lastPlayed = [collection.lastPlayed, ...games.map((g) => g.lastPlayed)].filter((d): d is string => !!d).sort().at(-1)

  return (
    <FeedGameCard
      title={collection.title}
      backdrop={collection.heroUrl ?? psnBackdrop(games[0])}
      icon={(cls) => <GameIcon source="psn" id={games[0].id} imageUrl={collection.iconUrl ?? games[0].imageIcon} size={64} className={cls} />}
      platform={{ source: 'psn', label: consoles }}
      progress={{ pct, percent: pct, done: pct >= 100 }}
      facts={[
        <span key="g" className="whitespace-nowrap">{games.length} {T.psn.collectionGames}</span>,
        <span key="t" className="whitespace-nowrap">{awarded}/{total} {T.psn.trophies.toLowerCase()}</span>,
        collection.playtimeMinutes !== null && <FeedGameCardPlaytime key="h" minutes={collection.playtimeMinutes} />,
        lastPlayed && <span key="d">{formatDate(lastPlayed, lang)}</span>,
      ]}
      expand={{ show: T.psn.showGames, hide: T.psn.hideGames }}
      expanded={expanded}
      onToggle={onToggle}
      className={className}
    >
      <PsnCollectionExpanded games={games} />
    </FeedGameCard>
  )
}
