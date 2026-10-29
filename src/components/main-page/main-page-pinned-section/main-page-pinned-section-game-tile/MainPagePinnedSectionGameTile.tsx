import type { ReactNode } from 'react'
import Link from 'next/link'
import type { LibraryGame } from '@/utils/library'
import GameIcon from '@/components/game-icon/GameIcon'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import { ProgressBar } from '@/components/ui/ProgressBar'

/** One pinned game, compact: its icon, name and platform, and how far along it is. Opens its page; the grip, when given, moves it. */
export default function MainPagePinnedSectionGameTile({ game, handle }: { game: LibraryGame; handle?: ReactNode }) {
  return (
    <div className="relative">
      <Link
        href={game.href}
        className={`flex items-center gap-3 rounded-tile p-2.5 bg-bg-main ring-1 ring-ink/[0.06] hover:ring-accent/40 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${handle ? 'pr-9' : ''}`}
      >
        <GameIcon source={game.source} id={game.id} imageUrl={game.iconUrl} size={40} className="w-10 h-10 rounded-lg shrink-0" />
        <span className="flex flex-col min-w-0 flex-1 gap-1">
          <span className="flex items-center gap-1.5 min-w-0">
            <PlatformLogo source={game.source} size={11} className="shrink-0" />
            <span className="text-xs font-semibold truncate">{game.title}</span>
          </span>
          <span className="flex items-center gap-2">
            <ProgressBar pct={game.pct} label={game.title} height="h-1" className="flex-1" />
            <span className={`text-[11px] font-semibold tabular-nums ${game.pct >= 100 ? 'text-success' : 'text-text-secondary'}`}>{game.pct}%</span>
          </span>
        </span>
      </Link>
      {/* Beside the link, not in it: a button inside a link is invalid. */}
      {handle && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex">{handle}</span>}
    </div>
  )
}
