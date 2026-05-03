import { useMemo } from 'react'
import { RetroAchievementsGameCompleted } from '@/types/types'

export default function MainPageConsoleBreakdown({
  games,
}: {
  games: RetroAchievementsGameCompleted[]
}) {
  const consoles = useMemo(() => {
    const map: Record<string, { total: number; completed: number; pts: number }> = {}
    for (const g of games) {
      if (!map[g.ConsoleName]) map[g.ConsoleName] = { total: 0, completed: 0, pts: 0 }
      map[g.ConsoleName].total++
      if (parseFloat(g.PctWon) >= 1) map[g.ConsoleName].completed++
      map[g.ConsoleName].pts += g.NumAwarded
    }
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, pct: Math.round((v.completed / v.total) * 100) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [games])

  if (consoles.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">Rank by console</p>
        <div className="flex items-center justify-center py-6 text-text-secondary text-sm">No data</div>
      </div>
    )
  }

  const maxTotal = consoles[0].total

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">Rank by console</p>
      <div className="flex flex-col gap-2">
        {consoles.map((c) => (
          <div key={c.name} className="flex flex-col gap-0.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold truncate max-w-[140px]">{c.name}</span>
              <span className="text-[10px] text-text-secondary shrink-0 ml-1">{c.total} games · {c.pct}% done</span>
            </div>
            <div className="flex gap-1 items-center">
              <div className="flex-1 bg-bg-main rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-accent/60 rounded-full"
                  style={{ width: `${(c.total / maxTotal) * 100}%` }}
                />
              </div>
              <div
                className="h-1.5 rounded-full bg-accent"
                style={{ width: `${(c.completed / maxTotal) * 100 + 4}px`, minWidth: c.completed > 0 ? '4px' : '0' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
