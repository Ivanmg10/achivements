import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RetroAchievementsGameCompleted } from '@/types/types'

export default function MainPageAlmostThere({ games }: { games: RetroAchievementsGameCompleted[] }) {
  const candidates = useMemo(() => {
    const best: Record<number, RetroAchievementsGameCompleted> = {}
    for (const g of games) {
      const pct = parseFloat(g.PctWon)
      if (pct < 0.75 || pct >= 1) continue
      const prev = best[g.GameID]
      if (!prev || pct > parseFloat(prev.PctWon)) best[g.GameID] = g
    }
    return Object.values(best)
      .sort((a, b) => parseFloat(b.PctWon) - parseFloat(a.PctWon))
      .slice(0, 6)
  }, [games])

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">Almost there (75–99%)</p>
        <div className="flex items-center justify-center py-4 text-text-secondary text-sm">No games in progress</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">Almost there (75–99%)</p>
      <div className="flex flex-col gap-2">
        {candidates.map((g) => {
          const pct = Math.round(parseFloat(g.PctWon) * 100)
          const remaining = g.MaxPossible - g.NumAwarded
          return (
            <Link
              key={`${g.GameID}-${g.HardcoreMode}`}
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
                  <span className="text-xs font-bold text-accent shrink-0">{pct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-bg-card rounded-full h-1 overflow-hidden">
                    <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-text-secondary shrink-0">{remaining} left</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
