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
    <dl className="flex flex-col gap-2.5 flex-1 min-w-0 lg:flex-none lg:w-full lg:grid lg:grid-cols-3 lg:gap-1 lg:text-center">
      <div className="flex items-baseline justify-between gap-2 lg:flex-col lg:items-center lg:justify-start lg:gap-0.5">
        <dt className="text-[11px] uppercase tracking-wide text-text-secondary lg:text-[0.625rem] lg:font-bold lg:tracking-[0.06em] lg:leading-tight">{T.gameExpanded.points}</dt>
        <dd className="text-base font-extrabold text-hardcore">{points}/{totalPoints}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-2 lg:flex-col lg:items-center lg:justify-start lg:gap-0.5">
        <dt className="text-[11px] uppercase tracking-wide text-text-secondary lg:text-[0.625rem] lg:font-bold lg:tracking-[0.06em] lg:leading-tight">{T.profileStats.hardcorePoints}</dt>
        <dd className="text-base font-extrabold text-warning">{hardcorePoints}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-2 lg:flex-col lg:items-center lg:justify-start lg:gap-0.5 lg:hidden">
        <dt className="text-[11px] uppercase tracking-wide text-text-secondary lg:text-[0.625rem] lg:font-bold lg:tracking-[0.06em] lg:leading-tight">{T.gameExpanded.completion}</dt>
        <dd className="text-base font-extrabold text-success">{completionPct}%</dd>
      </div>
      <div className="flex items-baseline justify-between gap-2 lg:flex-col lg:items-center lg:justify-start lg:gap-0.5">
        <dt className="text-[11px] uppercase tracking-wide text-text-secondary lg:text-[0.625rem] lg:font-bold lg:tracking-[0.06em] lg:leading-tight">{T.gameExpanded.remaining}</dt>
        <dd className="text-base font-extrabold text-info">{remaining}</dd>
      </div>
    </dl>
  )
}
