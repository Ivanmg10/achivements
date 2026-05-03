import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RetroAchievementsGameCompleted } from '@/types/types'

export default function MainPagePerfectGames({ games }: { games: RetroAchievementsGameCompleted[] }) {
  const { perfects, hcCount, scCount } = useMemo(() => {
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
      perfects: Object.values(byId),
      hcCount: hcIds.size,
      scCount: scIds.size,
    }
  }, [games])

  if (perfects.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">Perfect games — 100%</p>
        <div className="flex items-center justify-center py-8 text-text-secondary text-sm">No completed games yet</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">Perfect games — 100%</p>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-yellow-400 font-semibold">{hcCount} HC</span>
          <span className="text-text-secondary/40">·</span>
          <span className="text-text-secondary">{scCount} SC</span>
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
            <Image
              src={`https://retroachievements.org${g.ImageIcon}`}
              alt={g.Title}
              width={40}
              height={40}
              className="rounded hover:scale-110 transition-transform"
            />
            {g.HardcoreMode === '1' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-bg-card" title="Hardcore" />
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
