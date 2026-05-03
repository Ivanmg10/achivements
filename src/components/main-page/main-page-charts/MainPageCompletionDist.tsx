import { useMemo } from 'react'
import { RetroAchievementsGameCompleted } from '@/types/types'

const BUCKETS = [
  { label: '1–24%', min: 0, max: 0.25, color: 'bg-gray-500' },
  { label: '25–49%', min: 0.25, max: 0.5, color: 'bg-blue-500' },
  { label: '50–74%', min: 0.5, max: 0.75, color: 'bg-yellow-500' },
  { label: '75–99%', min: 0.75, max: 1, color: 'bg-orange-500' },
  { label: '100%', min: 1, max: Infinity, color: 'bg-green-500' },
]

export default function MainPageCompletionDist({ games }: { games: RetroAchievementsGameCompleted[] }) {
  const buckets = useMemo(() => {
    const counts = BUCKETS.map((b) => ({
      ...b,
      count: games.filter((g) => {
        const pct = parseFloat(g.PctWon)
        return pct >= b.min && pct < b.max
      }).length,
    }))
    const total = counts.reduce((s, b) => s + b.count, 0)
    return counts.map((b) => ({ ...b, pct: total > 0 ? (b.count / total) * 100 : 0 }))
  }, [games])

  const total = buckets.reduce((s, b) => s + b.count, 0)

  if (total === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">Completion distribution</p>
        <div className="flex items-center justify-center py-4 text-text-secondary text-sm">No data</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">Completion distribution</p>
        <span className="text-[10px] text-text-secondary/60">{total} games</span>
      </div>

      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {buckets.filter((b) => b.count > 0).map((b) => (
          <div
            key={b.label}
            className={`${b.color} transition-all`}
            style={{ width: `${b.pct}%` }}
            title={`${b.label}: ${b.count} games`}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {buckets.map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${b.color}`} />
            <span className="text-[11px] text-text-secondary w-12 shrink-0">{b.label}</span>
            <div className="flex-1 bg-bg-main rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full ${b.color} transition-all`}
                style={{ width: `${b.pct}%` }}
              />
            </div>
            <span className="text-[11px] text-text-secondary w-6 text-right shrink-0">{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
