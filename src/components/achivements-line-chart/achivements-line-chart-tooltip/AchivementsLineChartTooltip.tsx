'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { DayBySource } from '@/utils/utils'

/**
 * The day under the pointer: its date written out, then RA, Steam and PSN with
 * their own swatches and counts. A platform with nothing that day is left out.
 */
export default function AchivementsLineChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: DayBySource }[]
}) {
  const { T, lang } = useLanguage()
  const day = active ? payload?.[0]?.payload : undefined
  if (!day) return null

  const date = new Date(day.date + 'T00:00:00').toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'short' })
  const count = (n: number) => (n === 1 ? T.lineChart.oneAchievement : `${n} ${T.lineChart.achievements}`)
  const rows = [
    { name: 'RetroAchievements', value: day.ra, swatch: 'bg-chart-2' },
    { name: 'Steam', value: day.steam, swatch: 'bg-[#66c0f4]' },
    { name: 'PlayStation', value: day.psn, swatch: 'bg-[#0070d1]' },
  ].filter((r) => r.value > 0)

  return (
    <div className="rounded-xl bg-bg-header ring-1 ring-ink/10 shadow-xl shadow-black/40 px-3 py-2 text-xs flex flex-col gap-1">
      <span className="font-semibold text-text-main capitalize">{date}</span>
      {rows.length === 0 ? (
        <span className="text-text-secondary">{count(0)}</span>
      ) : (
        rows.map((r) => (
          <span key={r.name} className="flex items-center gap-2 text-text-secondary">
            <span aria-hidden="true" className={`w-2 h-2 rounded-sm ${r.swatch}`} />
            {r.name}
            <span className="ml-auto pl-3 font-semibold tabular-nums text-text-main">{r.value}</span>
          </span>
        ))
      )}
    </div>
  )
}
