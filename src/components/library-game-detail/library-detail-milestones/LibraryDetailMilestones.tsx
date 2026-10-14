'use client'

import { IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { Milestone } from '@/utils/gameInsights'

/**
 * The way to 100% in steps: the first achievement and each quarter, with the
 * day each was reached, or how many are still missing. Reached steps are
 * ticked, not only coloured.
 */
export default function LibraryDetailMilestones({ steps }: { steps: Milestone[] }) {
  const { T, lang } = useLanguage()
  const L = T.libraryDetail

  return (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-text-secondary text-sm px-1">{L.milestonesTitle}</p>
      <ol className="flex flex-col gap-2.5 px-1">
        {steps.map((s) => {
          const reached = s.at !== null
          return (
            <li key={s.pct} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${reached ? 'bg-success/20 text-success' : 'bg-ink/10 text-text-secondary'}`}
              >
                {reached ? <IconCheck size={14} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
              </span>
              <span className={`flex-1 text-sm ${reached ? 'text-text-main font-medium' : 'text-text-secondary'}`}>
                {s.pct === 0 ? L.milestoneFirst : L.milestonePct.replace('{n}', String(s.pct))}
              </span>
              <span className="text-xs tabular-nums text-text-secondary">
                {reached ? new Date(s.at!).toLocaleDateString(lang) : L.milestoneToGo.replace('{n}', String(s.left))}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
