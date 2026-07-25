'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IconEdit } from '@tabler/icons-react'
import { RetroAchievementsGameCompleted } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { usePerfectGamesOrder } from '@/hooks/usePerfectGamesOrder'
import { applyCustomOrder } from '@/utils/utils'
import PerfectGamesOrderModal from '@/components/main-page/perfect-games-order-modal/PerfectGamesOrderModal'

export default function MainPagePerfectGames({ games, isLoading }: { games: RetroAchievementsGameCompleted[]; isLoading?: boolean }) {
  const { T } = useLanguage()
  const { order, saveOrder } = usePerfectGamesOrder()
  const [editOpen, setEditOpen] = useState(false)

  const { rawPerfects, hcCount, scCount } = useMemo(() => {
    const hcIds = new Set<number>()
    const scIds = new Set<number>()
    const byId: Record<number, RetroAchievementsGameCompleted> = {}

    for (const g of games) {
      if (parseFloat(g.PctWon) < 1) continue
      if (g.HardcoreMode === '1') {
        hcIds.add(g.GameID)
        byId[g.GameID] = g
      } else if (!hcIds.has(g.GameID)) {
        scIds.add(g.GameID)
        byId[g.GameID] = g
      }
    }

    return {
      rawPerfects: Object.values(byId),
      hcCount: hcIds.size,
      scCount: scIds.size,
    }
  }, [games])

  const perfects = useMemo(() => applyCustomOrder(rawPerfects, order), [rawPerfects, order])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-2 w-28 rounded bg-white/10" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-10 h-10 rounded bg-white/10" />
          ))}
        </div>
      </div>
    )
  }

  if (perfects.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <Link
          href="/completed"
          className="text-[10px] uppercase tracking-widest text-text-secondary hover:text-text-main hover:underline transition-colors self-start"
        >
          {T.cards.mastered100}
        </Link>
        <div className="flex items-center justify-center py-8 text-text-secondary text-sm">{T.cards.noCompletedGames}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Link
          href="/completed"
          className="text-[10px] uppercase tracking-widest text-text-secondary hover:text-text-main hover:underline transition-colors"
        >
          {T.cards.mastered100}
        </Link>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-yellow-400 font-semibold">{hcCount} HC</span>
          <span className="text-text-secondary/40">·</span>
          <span className="text-text-secondary">{scCount} SC</span>
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
            key={g.GameID}
            href={`/gameInfo/${g.GameID}`}
            title={`${g.Title} — ${g.ConsoleName}`}
            className="relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded"
          >
            {g.ImageIcon && (
              <Image
                src={`https://retroachievements.org${g.ImageIcon}`}
                alt={g.Title}
                width={40}
                height={40}
                className="rounded hover:scale-110 transition-transform"
              />
            )}
            {g.HardcoreMode === '1' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full border border-bg-card" title="Hardcore" />
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
