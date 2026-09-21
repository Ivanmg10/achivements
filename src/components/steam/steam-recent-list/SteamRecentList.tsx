'use client'

import { useState } from 'react'
import { IconBrandSteam } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import SteamGameItem from '../steam-game-item/SteamGameItem'
import EmptyState from '@/components/empty-state/EmptyState'

const MAX_GAMES = 7

/**
 * Recently played Steam games on their own — the main page feed for a user
 * with Steam but no RA account. (With RA linked, Steam games join the RA feed
 * in RARecentlyPlayed instead.) One game expanded at a time, like that feed.
 */
export default function SteamRecentList() {
  const { T } = useLanguage()
  const { recent, recentLoading, recentError, refetch } = useSteamGamesData()
  const [expanded, setExpanded] = useState<number | null>(null)

  const games = recent.slice(0, MAX_GAMES)

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2">
      <h2 className="text-2xl font-bold shrink-0">{T.cards.recentlyPlayed}</h2>

      {recentLoading ? (
        <div aria-busy="true" className="flex flex-col gap-1.5 flex-1">
          {Array.from({ length: MAX_GAMES }).map((_, i) => (
            <div key={i} className="h-20 bg-bg-main rounded-xl animate-pulse" />
          ))}
        </div>
      ) : recentError ? (
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-sm text-red-400">
            {T.steam.gamesError}
          </p>
          <p className="text-xs text-text-secondary">{T.steam.privateProfileHint}</p>
          <button
            onClick={refetch}
            className="text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-white/10 transition-colors"
          >
            {T.steam.retry}
          </button>
        </div>
      ) : games.length === 0 ? (
        <EmptyState icon={<IconBrandSteam className="w-6 h-6" />} title={T.steam.recentEmpty} />
      ) : (
        <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto">
          {games.map((g) => (
            <SteamGameItem
              key={g.id}
              game={g}
              expanded={expanded === g.id}
              onToggle={() => setExpanded((cur) => (cur === g.id ? null : g.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
