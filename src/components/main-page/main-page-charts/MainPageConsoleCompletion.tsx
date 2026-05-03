import { useMemo } from 'react'
import { RetroAchievementsGameCompleted } from '@/types/types'

export default function MainPageConsoleCompletion({ games }: { games: RetroAchievementsGameCompleted[] }) {
  const consoles = useMemo(() => {
    const map: Record<string, { total: number; sum: number }> = {}
    for (const g of games) {
      const pct = parseFloat(g.PctWon)
      if (!map[g.ConsoleName]) map[g.ConsoleName] = { total: 0, sum: 0 }
      map[g.ConsoleName].total++
      map[g.ConsoleName].sum += pct
    }
    return Object.entries(map)
      .map(([name, { total, sum }]) => ({ name, total, avg: sum / total }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8)
  }, [games])

  if (consoles.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">Completion by console</p>
        <div className="flex items-center justify-center py-4 text-text-secondary text-sm">No data</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">Completion by console</p>
      <div className="flex flex-col gap-2">
        {consoles.map(({ name, total, avg }) => {
          const pct = Math.round(avg * 100)
          const barColor = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : pct >= 25 ? 'bg-blue-500' : 'bg-gray-500'
          return (
            <div key={name} className="flex items-center gap-2">
              <span className="text-[11px] text-text-secondary truncate w-24 shrink-0">{name}</span>
              <div className="flex-1 bg-bg-main rounded-full h-1.5 overflow-hidden">
                <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-baseline gap-1 shrink-0 w-14 justify-end">
                <span className="text-xs font-semibold text-text-main">{pct}%</span>
                <span className="text-[9px] text-text-secondary/60">{total}g</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
