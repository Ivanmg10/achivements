'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useSpotlight } from '@/hooks/useSpotlight'
import { CONSOLES } from '@/constants'
import type { ConsoleSummary } from '@/utils/library'

const ICON_BY_ID = new Map(CONSOLES.map((c) => [c.id, c.icon]))

/**
 * One tile per console with started RA games: how many, and what share of
 * them is at 100%, as a number and a bar. Each opens that console's games in
 * progress. Only consoles there is something to say about are drawn.
 */
export default function BrowseConsoles({ consoles }: { consoles: ConsoleSummary[] }) {
  const { T } = useLanguage()
  const onPointerMove = useSpotlight()
  if (consoles.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.consolesTitle}</p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
        {consoles.map((c) => {
          const icon = ICON_BY_ID.get(c.consoleId)
          return (
            <li key={c.consoleId}>
              <Link
                href={`/playing/${c.consoleId}`}
                onPointerMove={onPointerMove}
                className="spotlight flex flex-col gap-2 h-full rounded-xl bg-bg-main ring-1 ring-white/[0.04] p-3 hover:ring-white/15 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <span className="flex items-center gap-2 min-w-0">
                  {icon && <Image src={icon} alt="" width={20} height={20} className="w-5 h-5 object-contain shrink-0" />}
                  <span className="text-xs font-semibold truncate">{c.console}</span>
                </span>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] text-text-secondary">{c.games === 1 ? T.cards.oneGame : T.cards.nGames.replace('{n}', String(c.games))}</span>
                  <span className="text-sm font-bold tabular-nums text-warning">{c.pct}%</span>
                </span>
                <span aria-hidden="true" className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <span className="block h-full rounded-full bg-warning" style={{ width: `${c.pct}%` }} />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
