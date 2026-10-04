'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { IconEdit, IconTrophy } from '@tabler/icons-react'
import { RetroAchievementsGameCompleted, UserAwards } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import { useLanguage } from '@/context/LanguageContext'
import { usePerfectGamesOrder } from '@/hooks/usePerfectGamesOrder'
import { applyPerfectOrder, buildPerfectGames, countPerfectGames, latestPerfects } from '@/utils/perfectGames'
import PerfectPodium from './perfect-podium/PerfectPodium'
import PerfectGameTile from './perfect-game-tile/PerfectGameTile'
import { gameKey } from '@/utils/gameRef'
import PerfectGamesOrderModal from '@/components/main-page/perfect-games-order-modal/PerfectGamesOrderModal'
import EmptyState from '@/components/empty-state/EmptyState'

/**
 * Games with every achievement, from both platforms in one list, in the order
 * the user arranged (kept in our own database, so it survives whatever RA and
 * Steam report). Hardcore masteries and Steam games are marked in the corner.
 */
export default function MainPagePerfectGames({
  games,
  steamGames = [],
  awards = null,
  isLoading,
}: {
  games: RetroAchievementsGameCompleted[]
  steamGames?: SteamGameProgress[]
  /** RA awards: their dates say which games reached 100% last, for the podium. */
  awards?: UserAwards | null
  isLoading?: boolean
}) {
  const { T } = useLanguage()
  const { order, saveOrder } = usePerfectGamesOrder()
  const [editOpen, setEditOpen] = useState(false)

  const rawPerfects = useMemo(() => buildPerfectGames(games, steamGames), [games, steamGames])
  const perfects = useMemo(() => applyPerfectOrder(rawPerfects, order), [rawPerfects, order])
  const counts = useMemo(() => countPerfectGames(rawPerfects), [rawPerfects])
  const latest = useMemo(() => latestPerfects(awards?.VisibleUserAwards, steamGames), [awards, steamGames])
  // When each reached 100%, for the tooltips: RA from its awards, Steam its last session.
  const dates = useMemo(() => {
    const byKey = new Map<string, string>()
    for (const a of awards?.VisibleUserAwards ?? []) {
      if (a.AwardType !== 'Mastery/Completion') continue
      const key = gameKey('ra', a.AwardData)
      if ((byKey.get(key) ?? '') < a.AwardedAt) byKey.set(key, a.AwardedAt)
    }
    for (const g of steamGames) if (g.lastPlayed) byKey.set(gameKey('steam', g.id), g.lastPlayed)
    return byKey
  }, [awards, steamGames])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-2 w-28 rounded bg-ink/10" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-8 h-8 rounded bg-ink/10" />
          ))}
        </div>
      </div>
    )
  }

  const header = (
    <Link
      href="/completed"
      className="text-[10px] uppercase tracking-widest text-text-secondary hover:text-text-main hover:underline transition-colors self-start"
    >
      {T.cards.mastered100}
    </Link>
  )

  if (perfects.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {header}
        <EmptyState
          icon={<IconTrophy className="w-6 h-6" />}
          title={T.cards.noCompletedGames}
          subtitle={T.cards.noCompletedGamesSub}
          size="compact"
          className="py-2"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {header}
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-yellow-400 font-semibold">{counts.hc} HC</span>
          <span className="text-text-secondary/40">·</span>
          <span className="text-text-secondary">{counts.sc} SC</span>
          {counts.steam > 0 && (
            <>
              <span className="text-text-secondary/40">·</span>
              <span className="text-[#66c0f4] font-semibold">{counts.steam} Steam</span>
            </>
          )}
          <button
            onClick={() => setEditOpen(true)}
            aria-label={T.cards.reorderMasteredAria}
            className="p-1 rounded hover:bg-bg-card transition-colors text-text-secondary hover:text-text-main focus:outline-none focus:ring-2 focus:ring-accent/70 cursor-pointer"
          >
            <IconEdit className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>
      </div>

      <PerfectPodium games={latest} />

      {/* An even grid across the card's width, so the icons spread out instead of bunching at one side. */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-y-3 justify-items-center">
        {perfects.map((g) => (
          <PerfectGameTile key={g.key} game={g} date={dates.get(g.key)} />
        ))}
      </div>

      <PerfectGamesOrderModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        games={rawPerfects}
        order={order}
        onSaveOrder={saveOrder}
      />
    </div>
  )
}
