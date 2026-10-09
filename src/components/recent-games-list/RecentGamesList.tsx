'use client'

import { useState } from 'react'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { mergeRecentFeeds } from '@/utils/steamFeed'
import SteamGameItem from '@/components/steam/steam-game-item/SteamGameItem'
import PsnGameItem from '@/components/psn/psn-game-item/PsnGameItem'
import EmptyState from '@/components/empty-state/EmptyState'

const MAX_GAMES = 7

/**
 * Recently played Steam and PSN games, without RA — the main page feed for a
 * user with no RA account. (With RA linked, they join the RA feed in
 * RARecentlyPlayed instead.) One game expanded at a time, like that feed.
 */
export default function RecentGamesList() {
  const { T } = useLanguage()
  const { isLinked: steamLinked, recent, recentLoading, recentError, refetch } = useSteamGamesData()
  const { library: psn, libraryLoading: psnLoading, libraryError: psnError, refetch: refetchPsn } = usePsnGamesData()
  const [expanded, setExpanded] = useState<string | null>(null)

  const games = mergeRecentFeeds([], recent, MAX_GAMES, psn)
  // Only an error when nothing could be shown: one platform failing leaves the other's games.
  const failed = games.length === 0 && (recentError || psnError)

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2">
      <h2 className="text-2xl font-bold shrink-0">{T.cards.recentlyPlayed}</h2>

      {(recentLoading || psnLoading) && games.length === 0 ? (
        <div aria-busy="true" className="flex flex-col gap-1.5 flex-1">
          {Array.from({ length: MAX_GAMES }).map((_, i) => (
            <div key={i} className="h-20 bg-bg-main rounded-xl animate-pulse" />
          ))}
        </div>
      ) : failed ? (
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-sm text-red-400">
            {recentError ? T.steam.gamesError : T.psn.gamesError}
          </p>
          <p className="text-xs text-text-secondary">{recentError ? T.steam.privateProfileHint : T.psn.errors.private}</p>
          <button
            onClick={() => {
              if (recentError) refetch()
              if (psnError) refetchPsn()
            }}
            className="text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-ink/10 transition-colors"
          >
            {T.steam.retry}
          </button>
        </div>
      ) : games.length === 0 ? (
        <EmptyState icon={<SteamLogo className="w-6 h-6" />} title={steamLinked ? T.steam.recentEmpty : T.cards.noGames} />
      ) : (
        <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto">
          {games.map((item) => {
            const toggle = () => setExpanded((cur) => (cur === item.key ? null : item.key))
            if (item.source === 'psn') {
              return <PsnGameItem key={item.key} game={item.game} expanded={expanded === item.key} onToggle={toggle} />
            }
            if (item.source === 'steam') {
              return <SteamGameItem key={item.key} game={item.game} expanded={expanded === item.key} onToggle={toggle} />
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}
