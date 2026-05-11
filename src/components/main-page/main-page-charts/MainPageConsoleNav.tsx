'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { useAllGamesGlobal } from '@/hooks/useAllGamesGlobal'
import { CONSOLES } from '@/constants'
import { useLanguage } from '@/context/LanguageContext'

const CONSOLE_MAP = new Map(CONSOLES.map((c) => [c.id, c]))

const SECTION_SLUGS = [
  { slug: 'playing',    emoji: '🎮', key: 'playing'    as const },
  { slug: 'wantToPlay', emoji: '🔖', key: 'wantToPlay' as const },
  { slug: 'completed',  emoji: '🏆', key: 'completed'  as const },
] satisfies { slug: string; emoji: string; key: 'playing' | 'wantToPlay' | 'completed' }[]

function hasGamesForConsole(
  games: { ConsoleID: number }[],
  consoleId: number
): boolean {
  return games.some((g) => g.ConsoleID === consoleId)
}

export default function MainPageConsoleNav() {
  const { playing, wantToPlay, completed, loading } = useAllGamesGlobal()
  const { T } = useLanguage()

  const gamesBySection = useMemo(
    () => ({ playing, wantToPlay, completed }),
    [playing, wantToPlay, completed]
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        <div className="h-2 w-20 rounded bg-white/10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-bg-main rounded-lg p-3 flex flex-col gap-2">
              <div className="h-3 w-24 rounded bg-white/10" />
              <div className="flex flex-wrap gap-1.5">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="h-7 w-20 rounded-lg bg-white/10" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.navigation}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SECTION_SLUGS.map(({ slug, emoji, key }) => {
          const label = T.categories[key]
          const sectionGames = gamesBySection[key]
          return (
            <div key={slug} className="bg-bg-main rounded-lg p-3 flex flex-col gap-2.5">
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

              <div className="flex flex-wrap gap-1.5">
                {CONSOLES.map((con) => {
                  const def = CONSOLE_MAP.get(con.id)!
                  const active = hasGamesForConsole(sectionGames, con.id)
                  return (
                    <Link
                      key={con.id}
                      href={`/${slug}/${con.id}`}
                      title={con.name}
                      className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                        active
                          ? `${def.color} hover:brightness-125`
                          : 'bg-bg-card/40 text-text-secondary/30 hover:bg-bg-card hover:text-text-secondary'
                      }`}
                    >
                      <Image
                        src={def.icon}
                        alt={def.name}
                        width={16}
                        height={16}
                        className={`object-contain shrink-0 ${active ? '' : 'opacity-30'}`}
                      />
                      <span className="text-[10px] whitespace-nowrap">
                        {def.name}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
