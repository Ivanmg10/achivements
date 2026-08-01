'use client'

import { useLanguage } from '@/context/LanguageContext'

export function GameExpandedMobileStats({
  points,
  totalPoints,
  hardcorePoints,
  completionPct,
  remaining,
}: {
  points: number
  totalPoints: number
  hardcorePoints: number
  completionPct: number
  remaining: number
}) {
  const { T } = useLanguage()

  return (
    <dl className="flex flex-col gap-2.5 flex-1 min-w-0 lg:hidden">
      <div className="flex items-baseline justify-between gap-2">
        <dt className="text-[11px] uppercase tracking-wide text-text-secondary">{T.gameExpanded.points}</dt>
        <dd className="text-base font-bold text-yellow-400">{points}/{totalPoints}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <dt className="text-[11px] uppercase tracking-wide text-text-secondary">{T.profileStats.hardcorePoints}</dt>
        <dd className="text-base font-bold text-warning">{hardcorePoints}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <dt className="text-[11px] uppercase tracking-wide text-text-secondary">{T.gameExpanded.completion}</dt>
        <dd className="text-base font-bold text-success">{completionPct}%</dd>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <dt className="text-[11px] uppercase tracking-wide text-text-secondary">{T.gameExpanded.remaining}</dt>
        <dd className="text-base font-bold text-info">{remaining}</dd>
      </div>
    </dl>
  )
}
