'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { SampleGame } from '@/components/landing-page/landingSamples'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import LibraryPlatformBadge from '@/components/library-platform-badge/LibraryPlatformBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import Facts from '@/components/ui/Facts'

/**
 * One example game, drawn as the library's list draws a game: its cover at the cover's own size on the
 * game's colour, its name and platform, its progress, and what it counts. Not a link: it is an example.
 */
export default function LandingSampleGame({ game }: { game: SampleGame }) {
  const { T, lang } = useLanguage()
  const pct = Math.round((game.earned / game.total) * 100)
  const counted = (game.source === 'psn' ? T.gameInfoPage.ofTrophies : T.gameInfoPage.ofAchievements)
    .replace('{n}', game.earned.toLocaleString(lang))
    .replace('{total}', game.total.toLocaleString(lang))

  return (
    <li className="relative isolate flex items-center gap-3 p-2.5 sm:gap-4 sm:p-3 rounded-tile">
      <span className="rounded-[inherit]">
        <GameCardBackdrop src={game.cover} surface="main" />
      </span>
      <img src={game.cover} alt="" loading="lazy" decoding="async" className="w-14 h-14 shrink-0 object-cover rounded-box shadow-[0_6px_16px_rgb(0_0_0/0.45)]" />
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <span className="flex items-center gap-2 min-w-0">
          <span className="font-bold truncate">{game.title}</span>
          <LibraryPlatformBadge source={game.source} size="tag" />
        </span>
        <span className="flex items-center gap-2.5">
          <ProgressBar pct={pct} label={game.title} className="flex-1" />
          <span className={`w-10 text-right text-[0.8125rem] font-extrabold tabular-nums ${pct >= 100 ? 'text-success' : ''}`}>{pct}%</span>
        </span>
        <span className="text-xs text-text-secondary truncate">
          <Facts items={[game.console, counted, game.hours && `${game.hours.toLocaleString(lang)} ${T.steam.hoursShort}`]} />
        </span>
      </div>
    </li>
  )
}
