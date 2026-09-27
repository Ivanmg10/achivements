'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IconEdit, IconTrophy } from '@tabler/icons-react'
import { RetroAchievementsGameCompleted } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import { useLanguage } from '@/context/LanguageContext'
import { usePerfectGamesOrder } from '@/hooks/usePerfectGamesOrder'
import { applyPerfectOrder, buildPerfectGames, countPerfectGames } from '@/utils/perfectGames'
import PerfectGamesOrderModal from '@/components/main-page/perfect-games-order-modal/PerfectGamesOrderModal'
import EmptyState from '@/components/empty-state/EmptyState'
import SteamLogo from '@/components/steam-logo/SteamLogo'

/**
 * Tile side in px. Steam hands out its game icons at 32×32 and publishes no
 * bigger square: drawn any larger they are upscaled and look rough, so the
 * whole grid sticks to their native size.
 */
const TILE = 32

/**
 * Games with every achievement, from both platforms in one list, in the order
 * the user arranged (kept in our own database, so it survives whatever RA and
 * Steam report). Hardcore masteries and Steam games are marked in the corner.
 */
export default function MainPagePerfectGames({
  games,
  steamGames = [],
  isLoading,
}: {
  games: RetroAchievementsGameCompleted[]
  steamGames?: SteamGameProgress[]
  isLoading?: boolean
}) {
  const { T } = useLanguage()
  const { order, saveOrder } = usePerfectGamesOrder()
  const [editOpen, setEditOpen] = useState(false)

  const rawPerfects = useMemo(() => buildPerfectGames(games, steamGames), [games, steamGames])
  const perfects = useMemo(() => applyPerfectOrder(rawPerfects, order), [rawPerfects, order])
  const counts = useMemo(() => countPerfectGames(rawPerfects), [rawPerfects])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-2 w-28 rounded bg-white/10" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-8 h-8 rounded bg-white/10" />
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

      <div className="flex flex-wrap gap-2">
        {perfects.map((g) => (
          <Link
            key={g.key}
            href={g.source === 'steam' ? `/steamGame/${g.id}` : `/gameInfo/${g.id}`}
            title={`${g.title} — ${g.subtitle}`}
            aria-label={`${g.title} — ${g.subtitle}`}
            className="relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded"
          >
            {g.imageUrl ? (
              <Image
                src={g.imageUrl}
                alt=""
                width={TILE}
                height={TILE}
                className="rounded hover:scale-110 transition-transform"
                unoptimized={g.source === 'steam'}
              />
            ) : (
              <span className="block w-8 h-8 rounded bg-white/10" aria-hidden="true" />
            )}
            {g.source === 'steam' ? (
              <span
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-bg-card flex items-center justify-center"
                aria-hidden="true"
              >
                <SteamLogo size={10} className="text-[#66c0f4]" />
              </span>
            ) : (
              g.hardcore && (
                <span
                  className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full border border-bg-card"
                  title="Hardcore"
                />
              )
            )}
          </Link>
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
