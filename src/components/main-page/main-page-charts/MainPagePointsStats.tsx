import { RecentAchievement } from '@/types/types'

function pill(label: string, value: number, sub?: string, accent?: string) {
  return (
    <div className="bg-bg-main rounded-xl px-5 py-3 flex flex-col gap-0.5 flex-1">
      <span className="text-[10px] uppercase tracking-widest text-text-secondary">{label}</span>
      <span className={`text-2xl font-bold ${accent ?? 'text-text-main'}`}>
        {value.toLocaleString()}
      </span>
      {sub && <span className="text-xs text-text-secondary">{sub}</span>}
    </div>
  )
}

export default function MainPagePointsStats({ achievements }: { achievements: RecentAchievement[] }) {
  const now = new Date()
  const todayKey = now.toISOString().split('T')[0]
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)

  let ptsToday = 0, hcToday = 0, achToday = 0
  let pts7d = 0, hc7d = 0, sc7d = 0, ach7d = 0

  for (const a of achievements) {
    const d = new Date(a.Date)
    const hc = a.HardcoreMode === '1'
    if (a.Date.startsWith(todayKey)) {
      ptsToday += a.Points
      achToday++
      if (hc) hcToday += a.Points
    }
    if (d >= weekAgo) {
      pts7d += a.Points
      ach7d++
      if (hc) hc7d += a.Points
      else sc7d += a.Points
    }
  }

  const todaySub = ptsToday === 0 ? 'no activity' : `${achToday} achievement${achToday !== 1 ? 's' : ''}`

  return (
    <div className="grid grid-cols-2 sm:flex gap-3">
      {pill('Today', ptsToday, todaySub, ptsToday > 0 ? 'text-yellow-400' : undefined)}
      {pill('This week', pts7d, `${ach7d} achievement${ach7d !== 1 ? 's' : ''}`)}
      {pill('HC this week', hc7d, 'hardcore pts', hc7d > 0 ? 'text-yellow-400' : undefined)}
      {pill('SC this week', sc7d, 'softcore pts', sc7d > 0 ? 'text-blue-400' : undefined)}
    </div>
  )
}
