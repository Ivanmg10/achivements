'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { PsnTrophyGrid } from '@/components/psn/psn-trophy-grid/PsnTrophyGrid'
import PsnTrophyCounts from '@/components/psn/psn-trophy-counts/PsnTrophyCounts'
import LibraryGameDetail, { type LibraryCategory } from '@/components/library-game-detail/LibraryGameDetail'
import { fromPsn } from '@/utils/gameInsights'
import { formatPlaytime } from '@/utils/steamFeed'
import type { PsnGameProgress } from '@/types/psn'

const asCategory = (c?: string): LibraryCategory => (c === 'wantToPlay' || c === 'completed' ? c : 'playing')

/**
 * An opened PSN card in a status list: Steam's counterpart. Trophies load
 * when this mounts, i.e. when the card is opened; until then the ring uses the
 * counts the list already has.
 */
export default function PsnLibraryDetail({ game, category }: { game: PsnGameProgress; category?: string }) {
  const { T, lang } = useLanguage()
  const { trophies, groups, isLoading, error, retry } = usePsnTrophies(game.titleId)
  const items = useMemo(() => fromPsn(trophies, game.id), [trophies, game.id])

  const loaded = trophies.length > 0
  // The whole set, DLC included, as "completed" counts it.
  const total = loaded ? trophies.length : game.maxPossible
  const earned = loaded ? trophies.filter((t) => t.earned).length : game.numAwarded
  const units = { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }

  return (
    <LibraryGameDetail
      category={asCategory(category)}
      game={{ source: 'psn', id: game.id, title: game.title, iconUrl: game.imageIcon || undefined }}
      info={game.consoleName ? [{ label: T.libraryDetail.console, value: game.consoleName }] : []}
      items={items}
      state={isLoading ? 'loading' : error ? 'error' : 'ready'}
      errorNode={
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-sm text-red-400">{T.psn.trophiesError}</p>
          {error === 'private' && <p className="text-xs text-text-secondary">{T.psn.errors.private}</p>}
          <button onClick={retry} className="text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-ink/10 transition-colors">
            {T.psn.retry}
          </button>
        </div>
      }
      ring={{ earned, total, label: T.psn.trophies }}
      ringExtra={<PsnTrophyCounts earned={game.earned} of={game.defined} className="flex-col items-start! lg:items-center!" />}
      facts={
        game.playtimeMinutes ? [{ label: T.steam.playtime, value: formatPlaytime(game.playtimeMinutes, units, lang), className: 'text-[#0070d1]' }] : []
      }
      empty={T.psn.noTrophies}
      grid={<PsnTrophyGrid gameId={game.id} gameTitle={game.title} trophies={trophies} groups={groups} badgeSize={48} limit={60} />}
    />
  )
}
