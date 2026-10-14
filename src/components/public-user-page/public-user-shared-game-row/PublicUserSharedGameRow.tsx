'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { gameHref, PLATFORM_NAME } from '@/utils/gameRef'
import type { SharedGame } from '@/utils/library'
import GameIcon from '@/components/game-icon/GameIcon'
import { ProgressBar } from '@/components/ui/ProgressBar'

/** A game you both play: their progress over yours; opens the two side by side. */
export default function PublicUserSharedGameRow({ game, username }: { game: SharedGame; username: string }) {
  const { T } = useLanguage()
  const you = T.userProfile.you
  const ahead = game.theirPct === game.myPct ? null : game.theirPct > game.myPct ? username : you

  return (
    <Link
      href={`${gameHref(game.source, game.id, username)}?compare=1`}
      className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-main hover:bg-ink/10 transition-colors min-w-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <GameIcon source={game.source} id={game.id} imageUrl={game.iconUrl} size={44} className="w-11 h-11 rounded-lg shrink-0" />
      <span className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-sm font-medium truncate group-hover:text-accent transition-colors">{game.title}</span>
        <span className="text-[11px] text-text-secondary truncate">
          {PLATFORM_NAME[game.source]}
          {ahead && ` · ${T.userProfile.leads.replace('{who}', ahead)}`}
        </span>
        {[
          { who: username, pct: game.theirPct },
          { who: you, pct: game.myPct },
        ].map(({ who, pct }) => (
          <span key={who} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-2 text-[11px]">
            <span className="truncate text-text-secondary">{who}</span>
            <ProgressBar pct={pct} label={`${game.title} — ${who}`} />
            <span className={`tabular-nums text-right ${pct >= 100 ? 'text-success font-semibold' : 'text-text-secondary'}`}>{pct}%</span>
          </span>
        ))}
      </span>
    </Link>
  )
}
