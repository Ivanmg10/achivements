'use client'

import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'
import { CONSOLES } from '@/constants'
import type { UserAward } from '@/types/types'

const SHOWN = 5
const ICON_BY_NAME = new Map(CONSOLES.map((c) => [c.name, c.icon]))

/** Mastered, completed or beaten games per console, most first: where the trophies come from. */
export function awardsByConsole(awards: UserAward[]): { console: string; count: number }[] {
  const counts = new Map<string, Set<number>>()
  for (const a of awards) {
    if (a.AwardType !== 'Mastery/Completion' && a.AwardType !== 'Game Beaten') continue
    // A game beaten and then mastered is one game on that console, not two.
    if (!counts.has(a.ConsoleName)) counts.set(a.ConsoleName, new Set())
    counts.get(a.ConsoleName)!.add(a.AwardData)
  }
  return [...counts]
    .map(([console, games]) => ({ console, count: games.size }))
    .sort((a, b) => b.count - a.count || a.console.localeCompare(b.console))
}

/**
 * The consoles the user has finished most games on, as short bars against the
 * leader. Each bar carries its number, so the length is never read alone.
 */
export default function MasteryByConsole({ awards }: { awards: UserAward[] }) {
  const { T } = useLanguage()
  const rows = awardsByConsole(awards).slice(0, SHOWN)
  if (rows.length === 0) return null
  const max = rows[0].count

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] text-text-secondary uppercase tracking-widest">{T.cards.awardsByConsole}</p>
      <ul className="flex flex-col gap-1.5">
        {rows.map(({ console, count }) => {
          const icon = ICON_BY_NAME.get(console)
          return (
            <li key={console} className="grid grid-cols-[1rem_minmax(0,7rem)_1fr_auto] items-center gap-2 text-xs">
              {icon ? (
                <Image src={icon} alt="" width={16} height={16} className="w-4 h-4 object-contain" />
              ) : (
                <span aria-hidden="true" />
              )}
              <span className="truncate text-text-secondary">{console}</span>
              <span aria-hidden="true" className="h-1.5 rounded-full bg-warning/80" style={{ width: `${(count / max) * 100}%` }} />
              <span className="tabular-nums font-semibold text-text-main">{count}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
