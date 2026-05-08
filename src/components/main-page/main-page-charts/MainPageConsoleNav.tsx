'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { useAllGamesGlobal } from '@/hooks/useAllGamesGlobal'
import { CONSOLES } from '@/constants'
import { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'

const CONSOLE_MAP = new Map(CONSOLES.map((c) => [c.id, c]))

type ConsoleEntry = { id: number; name: string; icon: string }

function uniqueConsoles(
  games: (RetroAchievementsGameCompleted | WantToPlayGame)[]
): ConsoleEntry[] {
  const seen = new Set<number>()
  const result: ConsoleEntry[] = []
  for (const g of games) {
    if (seen.has(g.ConsoleID)) continue
    const def = CONSOLE_MAP.get(g.ConsoleID)
    if (!def) continue
    seen.add(g.ConsoleID)
    result.push({ id: g.ConsoleID, name: def.name, icon: def.icon })
  }
  return result
}

const SECTIONS = [
  { slug: 'playing',    label: 'Playing',      emoji: '🎮' },
  { slug: 'wantToPlay', label: 'Want to play',  emoji: '🔖' },
  { slug: 'completed',  label: 'Completed',     emoji: '🏆' },
] as const

export default function MainPageConsoleNav() {
  const { playing, wantToPlay, completed, loading } = useAllGamesGlobal()

  const bySection = useMemo(
    () => ({
      playing:    uniqueConsoles(playing),
      wantToPlay: uniqueConsoles(wantToPlay),
      completed:  uniqueConsoles(completed),
    }),
    [playing, wantToPlay, completed]
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-5 animate-pulse">
        <div className="h-2 w-28 rounded bg-white/10" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-2.5 w-20 rounded bg-white/10" />
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="h-6 w-16 rounded-md bg-white/10" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">Quick navigation</p>
      <div className="flex flex-col gap-4">
        {SECTIONS.map(({ slug, label, emoji }) => {
          const consoles = bySection[slug]
          return (
            <div key={slug} className="flex flex-col gap-2">
              <Link
                href={`/${slug}`}
                className="flex items-center gap-1.5 group w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded"
              >
                <span className="text-sm leading-none">{emoji}</span>
                <span className="text-xs font-semibold text-text-main group-hover:text-accent transition-colors">
                  {label}
                </span>
                <span className="text-[10px] text-text-secondary/50 ml-1">→</span>
              </Link>

              {consoles.length === 0 ? (
                <p className="text-[10px] text-text-secondary/40 pl-0.5">No games</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {consoles.map(({ id, name, icon }) => (
                    <Link
                      key={id}
                      href={`/${slug}/${id}`}
                      title={name}
                      className="flex items-center gap-1 bg-bg-main rounded-md px-2 py-1 hover:bg-white/10 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                    >
                      <Image
                        src={icon}
                        alt={name}
                        width={14}
                        height={14}
                        className="object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                      />
                      <span className="text-[10px] text-text-secondary group-hover:text-text-main transition-colors">
                        {name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
