'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { usePsnGameDetails } from '@/hooks/usePsnGameDetails'
import { PsnTrophyGrid } from '@/components/psn/psn-trophy-grid/PsnTrophyGrid'
import PsnTrophyCounts from '@/components/psn/psn-trophy-counts/PsnTrophyCounts'
import LibraryGameDetail from '@/components/library-game-detail/LibraryGameDetail'
import { asCategory } from '@/utils/utils'
import { fromPsn } from '@/utils/gameInsights'
import { formatPlaytime } from '@/utils/steamFeed'
import type { PsnGameProgress } from '@/types/psn'
import { psnBaseCompletedAt } from '@/utils/completionDates'
import ErrorRetry from '@/components/ui/ErrorRetry'
import { gameInfoRows } from '@/utils/gameInfoRows'
import { formatDay } from '@/utils/dates'


/**
 * An opened PSN card in a status list: Steam's counterpart. Trophies load
 * when this mounts, i.e. when the card is opened; until then the ring uses the
 * counts the list already has.
 */
export default function PsnLibraryDetail({ game, category }: { game: PsnGameProgress; category?: string }) {
  const { T, lang } = useLanguage()
  const { trophies, groups, isLoading, error, retry } = usePsnTrophies(game.titleId)
  const items = useMemo(() => fromPsn(trophies, game.id), [trophies, game.id])
  const completedAt = useMemo(() => psnBaseCompletedAt(trophies), [trophies])
  const detailCategory = asCategory(category)
  // What the game page's top says of it (IGDB), for a game not started: the only list that shows it.
  const { details, isLoading: detailsLoading } = usePsnGameDetails(detailCategory === 'wantToPlay' ? game.titleId : null)
  const info = gameInfoRows(T.libraryDetail, {
    console: game.consoleName,
    developers: details?.developers,
    publishers: details?.publishers,
    genres: details?.genres,
    released: details?.releaseDate ? formatDay(details.releaseDate.slice(0, 10), lang) : null,
  })

  const loaded = trophies.length > 0
  // The whole set, DLC included, as "completed" counts it.
  const total = loaded ? trophies.length : game.maxPossible
  const earned = loaded ? trophies.filter((t) => t.earned).length : game.numAwarded

  return (
    <LibraryGameDetail
      category={detailCategory}
      game={{ source: 'psn', id: game.id, title: game.title, iconUrl: game.imageIcon || undefined }}
      info={info}
      infoLoading={detailsLoading}
      items={items}
      completedAt={completedAt}
      state={isLoading ? 'loading' : error ? 'error' : 'ready'}
      errorNode={
        <ErrorRetry message={T.psn.trophiesError} hint={error === 'private' ? T.psn.errors.private : undefined} retryLabel={T.psn.retry} onRetry={retry} />
      }
      ring={{ earned, total, label: T.psn.trophies }}
      ringExtra={<PsnTrophyCounts earned={game.earned} of={game.defined} className="flex-col items-start! lg:items-center!" />}
      facts={
        game.playtimeMinutes ? [{ label: T.steam.playtime, value: formatPlaytime(game.playtimeMinutes, T.steam, lang), className: 'text-psn' }] : []
      }
      empty={T.psn.noTrophies}
      grid={<PsnTrophyGrid gameId={game.id} gameTitle={game.title} trophies={trophies} groups={groups} badgeSize={48} />}
    />
  )
}
