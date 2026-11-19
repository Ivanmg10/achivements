'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { CONSOLES, PLATFORM_CONSOLE_ICONS } from '@/constants'
import type { ConsoleTile } from '@/utils/library'
import { ProgressBar } from '@/components/ui/ProgressBar'
import Kicker from '@/components/ui/Kicker'
import { PLATFORM_LOGO } from '@/components/game-card-platform-tag/GameCardPlatformTag'

const ICON_BY_ID = new Map(CONSOLES.map((c) => [c.id, c.icon]))

/** The console's pixel icon; a PlayStation or Steam console without one yet shows its platform's logo. */
function TileIcon({ tile }: { tile: ConsoleTile }) {
  const icon = tile.consoleId !== undefined ? ICON_BY_ID.get(tile.consoleId) : PLATFORM_CONSOLE_ICONS[tile.name]
  if (icon) return <Image src={icon} alt="" width={20} height={20} className="w-5 h-5 object-contain shrink-0" />
  if (tile.source === 'ra' || tile.source === 'xbox') return null
  const Logo = PLATFORM_LOGO[tile.source]
  return <Logo size={16} aria-hidden="true" className={`w-5 shrink-0 ${tile.source === 'psn' ? 'text-psn' : 'text-steam'}`} />
}

/**
 * One tile per console with started games, on every platform (#164): how many,
 * and what share of them is at 100%, as a number and a bar. Each opens that
 * console's games. Only consoles there is something to say about are drawn.
 */
export default function BrowseConsoles({ consoles }: { consoles: ConsoleTile[] }) {
  const { T } = useLanguage()
  if (consoles.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <Kicker>{T.cards.consolesTitle}</Kicker>
      <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 enter-cards">
        {consoles.map((c) => (
          <li key={c.key}>
            <Link
              href={c.href}
              className="relative isolate flex flex-col gap-2 h-full rounded-tile bg-bg-main ring-1 ring-ink/[0.04] p-3 hover:ring-ink/15 transition focus-ring"
            >
              <span className="flex items-center gap-2 min-w-0">
                <TileIcon tile={c} />
                <span className="text-xs font-semibold truncate">{c.name}</span>
              </span>
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] text-text-secondary">{c.games === 1 ? T.cards.oneGame : T.cards.nGames.replace('{n}', String(c.games))}</span>
                <span className={`text-sm font-bold tabular-nums ${c.pct >= 100 ? 'text-success' : 'text-warning'}`}>{c.pct}%</span>
              </span>
              <ProgressBar pct={c.pct} label={c.name} height="h-1" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
