'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconStar } from '@tabler/icons-react'
import type { PinnedAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { usePinnedAchievements } from '@/hooks/usePinnedAchievements'
import { pinnedKey } from '@/utils/utils'
import AchievementModal from '@/components/achievement-modal/AchievementModal'
import EmptyState from '@/components/empty-state/EmptyState'
import MainPageFavoritesRaRow from './main-page-favorites-ra-row/MainPageFavoritesRaRow'
import MainPageFavoritesSteamRow from './main-page-favorites-steam-row/MainPageFavoritesSteamRow'

type RaPin = Extract<PinnedAchievement, { source: 'ra' }>

/** The main page's pinned achievements from RA and Steam together, newest first. */
export default function MainPageFavorites() {
  const { T } = useLanguage()
  const { pinned, isLoading, unpin } = usePinnedAchievements()
  const [selected, setSelected] = useState<RaPin | null>(null)

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.favorites.title}</p>
        {!isLoading && pinned.length > 0 && (
          <span className="text-[10px] text-text-secondary tabular-nums">{pinned.length}</span>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 animate-pulse" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-2.5 w-28 rounded bg-white/10" />
                <div className="h-2 w-20 rounded bg-white/10" />
              </div>
              <div className="w-6 h-4 rounded bg-white/10 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && pinned.length === 0 && (
        <EmptyState
          icon={<IconStar className="w-6 h-6" />}
          title={T.favorites.emptyTitle}
          subtitle={T.favorites.empty}
          size="compact"
        />
      )}

      {!isLoading && pinned.length > 0 && (
        // Across the card's full width, so a long list grows in columns rather than down.
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-1">
          {pinned.map((fav) =>
            fav.source === 'steam' ? (
              <MainPageFavoritesSteamRow key={pinnedKey(fav)} fav={fav} onUnpin={() => unpin(fav)} />
            ) : (
              <MainPageFavoritesRaRow
                key={pinnedKey(fav)}
                fav={fav}
                onOpen={() => setSelected(fav)}
                onUnpin={() => unpin(fav)}
              />
            ),
          )}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <AchievementModal
            achievement={selected.snapshot}
            numDistinctPlayers={selected.num_distinct_players}
            onClose={() => setSelected(null)}
            gameId={selected.game_id}
            isFavorited={true}
            onToggleFavorite={() => {
              unpin(selected)
              setSelected(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
