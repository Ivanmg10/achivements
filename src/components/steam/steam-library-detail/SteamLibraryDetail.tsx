'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { useSteamGameDetails } from '@/hooks/useSteamGameDetails'
import { SteamAchievementGrid } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import LibraryGameDetail from '@/components/library-game-detail/LibraryGameDetail'
import { asCategory } from '@/utils/utils'
import { fromSteam } from '@/utils/gameInsights'
import { formatPlaytime } from '@/utils/steamFeed'
import type { SteamGameProgress } from '@/types/steam'
import { latestFullSetCompletedAt } from '@/utils/completionDates'
import ErrorRetry from '@/components/ui/ErrorRetry'
import { gameInfoRows } from '@/utils/gameInfoRows'
import { formatStoreDate } from '@/utils/dates'


/**
 * An opened Steam card in a status list. The achievements load when this
 * mounts, i.e. when the card is opened; until then the ring uses the counts
 * the list already has.
 */
export default function SteamLibraryDetail({ game, category }: { game: SteamGameProgress; category?: string }) {
  const { T, lang } = useLanguage()
  const { achievements, isLoading, error, retry } = useSteamAchievements(game.id)
  const items = useMemo(() => fromSteam(achievements, game.id), [achievements, game.id])
  const detailCategory = asCategory(category)
  // What the game page's top says of it (the store), for a game not started: the only list that shows it.
  const { details, isLoading: detailsLoading } = useSteamGameDetails(detailCategory === 'wantToPlay' ? game.id : null)
  const info = gameInfoRows(T.libraryDetail, {
    developers: details?.developers,
    publishers: details?.publishers,
    genres: details?.genres,
    released: formatStoreDate(details?.releaseDate, lang),
  })

  const loaded = achievements.length > 0
  const total = loaded ? achievements.length : game.maxPossible
  const earned = loaded ? achievements.filter((a) => a.earned).length : game.numAwarded

  return (
    <LibraryGameDetail
      category={detailCategory}
      game={{ source: 'steam', id: game.id, title: game.title, iconUrl: game.imageIcon || undefined }}
      info={info}
      infoLoading={detailsLoading}
      items={items}
      completedAt={latestFullSetCompletedAt(items)}
      state={isLoading ? 'loading' : error ? 'error' : 'ready'}
      errorNode={
        <ErrorRetry message={T.steam.achievementsError} hint={T.steam.privateProfileHint} retryLabel={T.steam.retry} onRetry={retry} />
      }
      ring={{ earned, total, label: T.gameExpanded.allAchievements }}
      facts={[
        { label: T.steam.playtime, value: formatPlaytime(game.playtimeForever, T.steam, lang), className: 'text-steam' },
        ...(game.playtime2Weeks > 0 ? [{ label: T.steam.last2Weeks, value: formatPlaytime(game.playtime2Weeks, T.steam, lang) }] : []),
      ]}
      empty={T.steam.noAchievements}
      grid={<SteamAchievementGrid appId={game.id} gameTitle={game.title} achievements={achievements} badgeSize={48} />}
    />
  )
}
