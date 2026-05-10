'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RetroAchievementsGameCompleted } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { DualProgressBar } from '@/components/ui/DualProgressBar'

export default function MainPageAlmostThere({ games, isLoading }: { games: RetroAchievementsGameCompleted[]; isLoading?: boolean }) {
  const { T } = useLanguage()

  const candidates = useMemo(() => {
    const scPcts: Record<number, number> = {}
    const hcPcts: Record<number, number> = {}
    const gameInfo: Record<number, RetroAchievementsGameCompleted> = {}

    for (const g of games) {
      const pct = parseFloat(g.PctWon)
      if (pct < 0.75 || pct >= 1) continue
      const isHc = Number(g.HardcoreMode) === 1
      if (isHc) {
        if (hcPcts[g.GameID] === undefined || pct > hcPcts[g.GameID]) hcPcts[g.GameID] = pct
      } else {
        if (scPcts[g.GameID] === undefined || pct > scPcts[g.GameID]) scPcts[g.GameID] = pct
      }
      if (!gameInfo[g.GameID] || pct > parseFloat(gameInfo[g.GameID].PctWon)) {
        gameInfo[g.GameID] = g
      }
    }

    const allIds = new Set([...Object.keys(scPcts), ...Object.keys(hcPcts)].map(Number))
    return Array.from(allIds)
      .map((id) => ({
        game: gameInfo[id],
        scPct: scPcts[id] ?? 0,
        hcPct: hcPcts[id] ?? 0,
        bestPct: Math.max(scPcts[id] ?? 0, hcPcts[id] ?? 0),
      }))
      .sort((a, b) => b.bestPct - a.bestPct)
      .slice(0, 6)
  }, [games])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-2 w-28 rounded bg-white/10" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2 bg-bg-main rounded-lg p-2">
            <div className="w-7 h-7 rounded bg-white/10 shrink-0" />
            <div className="flex flex-col flex-1 gap-1.5">
              <div className="h-2.5 w-24 rounded bg-white/10" />
              <div className="flex-1 bg-white/10 rounded-full h-1" />
            </div>
            <div className="h-2.5 w-8 rounded bg-white/10 shrink-0" />
          </div>
        ))}
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.almostThere}</p>
        <div className="flex items-center justify-center py-4 text-text-secondary text-sm">{T.cards.noGamesInProgress}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 flex-1">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.almostThere}</p>
      <div className="flex flex-col gap-2 flex-1">
        {candidates.map(({ game: g, scPct, hcPct, bestPct }) => {
          const remaining = g.MaxPossible - g.NumAwarded
          return (
            <Link
              key={g.GameID}
              href={`/gameInfo/${g.GameID}`}
              className="flex items-center gap-2 bg-bg-main rounded-lg p-2 hover:bg-white/5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {g.ImageIcon && (
                <Image
                  src={`https://retroachievements.org${g.ImageIcon}`}
                  alt={g.Title}
                  width={28}
                  height={28}
                  className="rounded shrink-0"
                />
              )}
              <div className="flex flex-col min-w-0 flex-1 gap-1">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-xs font-semibold truncate group-hover:text-accent transition-colors">{g.Title}</span>
                  <span className="text-xs font-bold text-accent shrink-0">{Math.round(bestPct * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <DualProgressBar
                    softcorePct={scPct * 100}
                    hardcorePct={hcPct * 100}
                    trackClass="bg-bg-card"
                    height="h-1"
                    className="flex-1"
                  />
                  <span className="text-[9px] text-text-secondary shrink-0">{remaining} {T.cards.left}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
