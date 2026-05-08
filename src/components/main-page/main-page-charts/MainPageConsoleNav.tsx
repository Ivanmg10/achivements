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
  { slug: 'playing',    label: 'Playing',     emoji: '🎮' },
  { slug: 'wantToPlay', label: 'Want to play', emoji: '🔖' },
  { slug: 'completed',  label: 'Completed',    emoji: '🏆' },
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
      <div className="flex flex-col gap-3 animate-pulse">
        <div className="h-2 w-20 rounded bg-white/10" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-bg-main rounded-lg p-3 flex flex-col gap-2">
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="flex gap-2">
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-7 w-20 rounded-lg bg-white/10" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">Navigation</p>
      <div className="flex flex-col gap-2">
        {SECTIONS.map(({ slug, label, emoji }) => {
          const consoles = bySection[slug]
          return (
            <div key={slug} className="bg-bg-main rounded-lg p-3 flex flex-col gap-2.5">
              {/* Section title → links to /[slug] */}
              <Link
                href={`/${slug}`}
                className="flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none">{emoji}</span>
                  <span className="text-xs font-semibold text-text-main group-hover:text-accent transition-colors">
                    {label}
                  </span>
                </div>
                <span className="text-[10px] text-text-secondary/50 group-hover:text-accent transition-colors">→</span>
              </Link>

              {consoles.length === 0 ? (
                <p className="text-[10px] text-text-secondary/40">No games</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {consoles.map(({ id, name, icon }) => (
                    <Link
                      key={id}
                      href={`/${slug}/${id}`}
                      title={name}
                      className="flex items-center gap-1.5 bg-bg-card rounded-md px-2 py-1.5 hover:bg-white/10 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                    >
                      <Image
                        src={icon}
                        alt={name}
                        width={16}
                        height={16}
                        className="object-contain shrink-0"
                      />
                      <span className="text-[10px] text-text-secondary group-hover:text-text-main transition-colors whitespace-nowrap">
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
