'use client'

import { RetroAchievementsGameWithAchievements } from '@/types/types'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { ProgressBar } from '@/components/ui/ProgressBar'

export default function MainPageProfileRaGame({
  game,
  richPresenceMsg,
}: {
  game: RetroAchievementsGameWithAchievements
  richPresenceMsg?: string
}) {
  const { T } = useLanguage()

  const scPct = parseFloat(game.UserCompletion ?? '0') || 0
  const hcPct = parseFloat(game.UserCompletionHardcore ?? '0') || 0

  return (
    <Link
      className="bg-bg-main rounded-lg p-3 flex flex-col gap-3 w-full hover:scale-[1.005] transition-transform duration-200"
      href={`/gameInfo/${game.ID}`}
    >
      <p className="text-xs text-text-secondary uppercase tracking-wider">{T.profileRa.playingNow}</p>
      {richPresenceMsg && <p className="text-xs text-gray-300 italic">{richPresenceMsg}</p>}
      <div className="flex gap-3 items-center">
        {game.ImageIcon && (
          <Image
            src={`https://retroachievements.org${game.ImageIcon}`}
            alt="GameIcon"
            width={50}
            height={50}
            className="rounded-lg shrink-0"
          />
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-semibold truncate">{game.Title}</span>
          <span className="text-xs text-text-secondary">{game.ConsoleName}</span>
        </div>
      </div>
      {scPct > 0 || hcPct > 0 ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full bg-progress-soft" />
              <span className={scPct >= 100 ? 'text-success font-semibold' : ''}>{game.UserCompletion ?? '0%'}</span>
            </span>
            {hcPct > 0 && (
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full bg-progress" />
                <span className={hcPct >= 100 ? 'text-success font-semibold' : ''}>{game.UserCompletionHardcore}</span>
              </span>
            )}
          </div>
          <ProgressBar pct={hcPct} softPct={scPct} label={game.Title ?? ''} trackClass="bg-bg-card" height="h-2" />
        </div>
      ) : null}
    </Link>
  )
}
