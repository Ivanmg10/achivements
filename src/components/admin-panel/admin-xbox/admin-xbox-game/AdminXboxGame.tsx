'use client'

import { useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAdminXboxAchievements } from '@/hooks/useAdminXboxAchievements'
import type { XboxGameProgress } from '@/types/xbox'
import { Skeleton } from '@/components/ui/Skeleton'

/** Admin panel text is English (exempt from i18n). */

/** One game of the explorer's library; opening it loads its achievements. */
export default function AdminXboxGame({ xuid, game }: { xuid: string; game: XboxGameProgress }) {
  const [open, setOpen] = useState(false)
  const { achievements, error, loading, load } = useAdminXboxAchievements(xuid, game.titleId)
  const panelId = `xbox-game-${game.titleId}`
  const counts = game.totalKnown ? `${game.numAwarded}/${game.maxPossible}` : `${game.numAwarded}`

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && achievements === null && !loading) void load()
  }

  return (
    <li className="bg-bg-main rounded-tile">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center gap-3 p-3 text-left rounded-tile focus-visible:ring-2 focus-visible:ring-accent/70 outline-none"
      >
        {game.imageIcon ? (
          <img src={game.imageIcon} alt="" width={40} height={40} loading="lazy" decoding="async" className="size-10 rounded-md object-cover shrink-0" />
        ) : (
          <span className="size-10 rounded-md bg-ink/10 shrink-0" aria-hidden="true" />
        )}
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold truncate">{game.title}</span>
          <span className="block text-xs text-text-secondary truncate">
            {game.platforms.join(' · ') || 'Unknown platform'}
            {game.lastPlayed && ` · played ${new Date(game.lastPlayed).toLocaleDateString()}`}
          </span>
          <ProgressBar pct={game.pctWon} label={`${game.title} progress`} className="mt-1.5" />
        </span>
        <span className="text-right text-xs text-text-secondary shrink-0">
          <span className="block font-semibold text-text-main">{game.pctWon}%</span>
          <span className="block">{counts} ach.</span>
          <span className="block">
            {game.earnedGamerscore}/{game.totalGamerscore} G
          </span>
        </span>
        <IconChevronDown size={16} aria-hidden="true" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id={panelId} className="px-3 pb-3">
          {loading && <Skeleton className="h-5 w-40" />}
          {error && (
            <p role="alert" className="text-sm text-danger">
              Could not load the achievements.{' '}
              <button type="button" onClick={() => void load()} className="underline hover:text-danger">
                Retry
              </button>
            </p>
          )}
          {achievements && achievements.length === 0 && <p className="text-sm text-text-secondary">This game has no achievements.</p>}
          {achievements && achievements.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {achievements.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <span className={`shrink-0 text-xs font-semibold ${a.unlocked ? 'text-success' : 'text-text-secondary'}`}>
                    {a.unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="font-medium">{a.name}</span>
                    {a.secret && <span className="text-xs text-text-secondary"> (secret)</span>}
                    <span className="block text-xs text-text-secondary">{a.description}</span>
                  </span>
                  <span className="shrink-0 text-xs text-text-secondary text-right">
                    <span className="block">{a.gamerscore} G</span>
                    {a.rarity !== null && <span className="block">{a.rarity}%</span>}
                    {a.unlockedAt && <span className="block">{new Date(a.unlockedAt).toLocaleDateString()}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  )
}
