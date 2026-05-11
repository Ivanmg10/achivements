'use client'

import { useMemo } from 'react'
import { RetroAchievementsGameCompleted } from '@/types/types'
import { DualProgressBar } from '@/components/ui/DualProgressBar'
import { useLanguage } from '@/context/LanguageContext'

export default function MainPageConsoleCompletion({ games }: { games: RetroAchievementsGameCompleted[] }) {
  const { T } = useLanguage()
  const consoles = useMemo(() => {
    const map: Record<string, { scSum: number; scCount: number; hcSum: number; hcCount: number }> = {}
    for (const g of games) {
      const pct = parseFloat(g.PctWon)
      if (!map[g.ConsoleName]) map[g.ConsoleName] = { scSum: 0, scCount: 0, hcSum: 0, hcCount: 0 }
      if (Number(g.HardcoreMode) === 1) {
        map[g.ConsoleName].hcSum += pct
        map[g.ConsoleName].hcCount++
      } else {
        map[g.ConsoleName].scSum += pct
        map[g.ConsoleName].scCount++
      }
    }
    return Object.entries(map)
      .map(([name, { scSum, scCount, hcSum, hcCount }]) => {
        const scAvg = scCount > 0 ? scSum / scCount : 0
        const hcAvg = hcCount > 0 ? hcSum / hcCount : 0
        return { name, total: scCount + hcCount, scAvg, hcAvg, bestAvg: Math.max(scAvg, hcAvg) }
      })
      .sort((a, b) => b.bestAvg - a.bestAvg)
      .slice(0, 8)
  }, [games])

  if (consoles.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.charts.consoleCompletionTitle}</p>
        <div className="flex items-center justify-center py-4 text-text-secondary text-sm">{T.cards.noData}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.charts.consoleCompletionTitle}</p>
      <div className="flex flex-col gap-2">
        {consoles.map(({ name, total, scAvg, hcAvg, bestAvg }) => {
          const pct = Math.round(bestAvg * 100)
          return (
            <div key={name} className="flex items-center gap-2">
              <span className="text-[11px] text-text-secondary truncate w-24 shrink-0">{name}</span>
              <DualProgressBar
                softcorePct={scAvg * 100}
                hardcorePct={hcAvg * 100}
                trackClass="bg-bg-main"
                height="h-1.5"
                className="flex-1"
              />
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
