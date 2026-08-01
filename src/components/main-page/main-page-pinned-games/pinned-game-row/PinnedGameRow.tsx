'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical } from '@tabler/icons-react'
import { useGameProgression } from '@/hooks/useGameProgression'
import { useLanguage } from '@/context/LanguageContext'
import { RetroAchievement } from '@/types/types'
import { CONSOLES } from '@/constants'
import { DualProgressBar } from '@/components/ui/DualProgressBar'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import { RARecentlyPlayedExpanded } from '@/components/ra-recently-played/ra-recently-played-expanded/RARecentlyPlayedExpanded'

const CONSOLE_BY_ID = new Map(CONSOLES.map((c) => [c.id, c.icon]))

function pct(earned: number, total: number) {
  if (!total) return 0
  return (earned / total) * 100
}

export default function PinnedGameRow({
  gameId,
  isOpen,
  onToggle,
}: {
  gameId: number
  isOpen: boolean
  onToggle: () => void
}) {
  const { T } = useLanguage()
  const { game, isLoading } = useGameProgression(String(gameId))
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: gameId,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  if (isLoading || !game) {
    return (
      <div ref={setNodeRef} style={style} className="bg-bg-main rounded-xl h-24 animate-pulse" />
    )
  }

  const achievements = Object.values(game.Achievements ?? {})
    .filter((a): a is RetroAchievement => !!a)
    .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
  const total = game.NumAchievements ?? 0
  const consoleIcon = game.ConsoleID ? CONSOLE_BY_ID.get(game.ConsoleID) : undefined
  const earned = game.NumAwardedToUser ?? 0
  const earnedHardcore = game.NumAwardedToUserHardcore ?? 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-bg-main rounded-xl overflow-hidden flex flex-col ${isDragging ? 'opacity-50 shadow-2xl relative z-10' : ''}`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        className="flex items-center gap-3 px-3 py-3 w-full text-left hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none"
      >
        <button
          {...attributes}
          {...listeners}
          aria-label={T.cards.dragToReorder}
          onClick={(e) => e.stopPropagation()}
          className="text-text-secondary/30 hover:text-text-secondary/70 cursor-grab active:cursor-grabbing touch-none shrink-0 focus-visible:outline-none"
        >
          <IconGripVertical className="w-4 h-4" aria-hidden />
        </button>

        <Link
          href={`/gameInfo/${gameId}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 focus-visible:outline-none"
        >
          {game.ImageIcon ? (
            <Image
              src={`https://retroachievements.org${game.ImageIcon}`}
              alt={game.Title ?? ''}
              width={56}
              height={56}
              className="rounded-xl object-cover w-14 h-14"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-white/10 shrink-0" />
          )}
        </Link>

        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <Link
            href={`/gameInfo/${gameId}`}
            onClick={(e) => e.stopPropagation()}
            className="w-fit max-w-full focus-visible:outline-none hover:underline underline-offset-2 decoration-white/40"
          >
            <span className="text-base font-bold block truncate leading-tight">{game.Title}</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 shrink-0">
              {consoleIcon && (
                <Image
                  src={consoleIcon}
                  alt={game.ConsoleName ?? ''}
                  width={12}
                  height={12}
                  className="w-3 h-3 object-contain opacity-60 shrink-0"
                />
              )}
              <span className="text-xs text-text-secondary whitespace-nowrap">{game.ConsoleName}</span>
            </div>
            {total > 0 && (
              <DualProgressBar
                softcorePct={pct(earned, total)}
                hardcorePct={pct(earnedHardcore, total)}
                className="flex-1"
              />
            )}
            <PinToggleButton gameId={gameId} onClick={(e) => e.stopPropagation()} />
            <span
              className="text-text-secondary/30 text-[10px] shrink-0 transition-transform duration-300"
              style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▼
            </span>
          </div>

          {total > 0 && (
            <div className="flex items-center gap-2 text-xs text-text-secondary/50">
              <span>
                {earned}/{total} {T.statusGameItem.achievements}
              </span>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="px-3 pb-3 pt-1">
          <RARecentlyPlayedExpanded
            game={{ GameID: gameId, Title: game.Title ?? '', NumAchieved: earned, NumPossibleAchievements: total }}
            achievements={achievements}
            numDistinctPlayers={game.NumDistinctPlayers ?? 1}
            isLoading={false}
          />
        </div>
      )}
    </div>
  )
}
