'use client'

import { useLanguage } from '@/context/LanguageContext'
import { TROPHY_GRADE_COLOR, TROPHY_GRADES } from '@/utils/psnTitles'
import type { TrophyCounts } from '@/types/psn'

/**
 * Trophies by grade, best first — "1 platinum, 4 gold…". With `of`, each
 * reads "earned / defined". Every number carries its grade's name, so the
 * colour is never the only way to tell them apart.
 */
export default function PsnTrophyCounts({
  earned,
  of,
  className = '',
}: {
  earned: TrophyCounts
  of?: TrophyCounts
  className?: string
}) {
  const { T } = useLanguage()
  const names = { platinum: T.psn.platinum, gold: T.psn.gold, silver: T.psn.silver, bronze: T.psn.bronze }

  return (
    <ul className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${className}`}>
      {TROPHY_GRADES.filter((grade) => !of || of[grade] > 0).map((grade) => (
        <li key={grade} className="flex items-center gap-1 tabular-nums">
          <span aria-hidden="true" className={TROPHY_GRADE_COLOR[grade]}>
            ●
          </span>
          <span className="text-text-main font-semibold">
            {earned[grade]}
            {of && <span className="text-text-secondary font-normal">/{of[grade]}</span>}
          </span>
          <span className="text-text-secondary">{names[grade]}</span>
        </li>
      ))}
    </ul>
  )
}
