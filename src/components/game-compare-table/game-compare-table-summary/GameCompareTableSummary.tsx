'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { CompareSummary } from '@/utils/gameCompare'
import { ProgressBar } from '@/components/ui/ProgressBar'

/** How far each of you is in the game, as count and bar; and how many you share, when comparing. */
export default function GameCompareTableSummary({
  summary,
  username,
  comparing,
}: {
  summary: CompareSummary
  username: string
  comparing: boolean
}) {
  const { T } = useLanguage()
  const people = [{ who: username, n: summary.theirs }, ...(comparing ? [{ who: T.userProfile.you, n: summary.mine }] : [])]

  return (
    <div className="flex flex-col gap-2">
      {people.map(({ who, n }) => {
        const pct = summary.all ? Math.round((n / summary.all) * 100) : 0
        return (
          <div key={who} className="grid grid-cols-[5rem_1fr_auto] sm:grid-cols-[7rem_1fr_auto] items-center gap-3 text-xs">
            <span className="font-medium truncate">{who}</span>
            <ProgressBar pct={pct} label={who} height="h-2" />
            <span className={`tabular-nums ${pct >= 100 ? 'text-success font-semibold' : 'text-text-secondary'}`}>
              {n}/{summary.all} · {pct}%
            </span>
          </div>
        )
      })}
      {comparing && (
        <p className="text-xs text-text-secondary">{T.userGame.inCommon.replace('{n}', String(summary.both))}</p>
      )}
    </div>
  )
}
