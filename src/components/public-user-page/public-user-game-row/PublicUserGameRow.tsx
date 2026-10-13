import Link from 'next/link'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { LibraryGame } from '@/utils/library'
import GameIcon from '@/components/game-icon/GameIcon'
import { ProgressBar } from '@/components/ui/ProgressBar'

/** One of a user's games: icon, title, where it is played and how far along; opens their progress in it. */
export default function PublicUserGameRow({ game }: { game: LibraryGame }) {
  const done = game.pct >= 100
  return (
    <Link
      href={game.href}
      className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-main hover:bg-ink/10 transition-colors min-w-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <GameIcon source={game.source} id={game.id} imageUrl={game.iconUrl} size={44} className="w-11 h-11 rounded-lg shrink-0" />
      <span className="flex flex-col gap-1.5 min-w-0 flex-1">
        <span className="text-sm font-medium truncate group-hover:text-accent transition-colors">{game.title}</span>
        <span className="text-[11px] text-text-secondary truncate">
          {game.subtitle === PLATFORM_NAME[game.source] ? game.subtitle : `${game.subtitle} · ${PLATFORM_NAME[game.source]}`}
        </span>
        <ProgressBar pct={game.pct} label={game.title} />
      </span>
      <span className={`text-xs font-semibold tabular-nums shrink-0 w-10 text-right ${done ? 'text-success' : 'text-text-secondary'}`}>
        {game.pct}%
      </span>
    </Link>
  )
}
