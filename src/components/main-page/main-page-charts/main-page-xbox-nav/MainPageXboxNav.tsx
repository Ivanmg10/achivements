'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesByCategory } from '@/hooks/useXboxGamesByCategory'
import GameIcon from '@/components/game-icon/GameIcon'
import { gameHref } from '@/utils/gameRef'
import { Skeleton } from '@/components/ui/Skeleton'

const PREVIEW = 6

const SECTIONS = [
  { slug: 'wantToPlay', emoji: '🔖' },
  { slug: 'playing', emoji: '🎮' },
  { slug: 'completed', emoji: '🏆' },
] as const

/**
 * Xbox's side of the navigation card, like PSN's: each section with how many
 * Xbox games it holds and the first few, linking to the category page and to
 * each game.
 */
export default function MainPageXboxNav() {
  const { T } = useLanguage()
  const sections = {
    playing: useXboxGamesByCategory('playing'),
    wantToPlay: useXboxGamesByCategory('wantToPlay'),
    completed: useXboxGamesByCategory('completed'),
  }
  const loading = sections.playing.loading

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.navigation}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SECTIONS.map(({ slug, emoji }) => {
          const { games } = sections[slug]
          return (
            <div key={slug} className="bg-bg-main rounded-box p-3 flex flex-col gap-2.5">
              <Link
                href={`/${slug}`}
                className="flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-sm leading-none" aria-hidden="true">{emoji}</span>
                  <span className="text-xs font-semibold text-text-main group-hover:text-accent transition-colors">
                    {T.categories[slug]}
                  </span>
                </span>
                <span className="text-[10px] font-semibold text-success tabular-nums">{loading ? '—' : games.length}</span>
              </Link>

              {loading ? (
                <div className="flex gap-1.5" aria-busy="true">
                  {[0, 1, 2, 3].map((i) => <Skeleton key={i} radius="tag" className="w-8 h-8" />)}
                </div>
              ) : games.length === 0 ? (
                <p className="text-[10px] text-text-secondary">{T.xbox.noGamesInCategory}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {games.slice(0, PREVIEW).map((g) => (
                    <Link
                      key={g.id}
                      href={gameHref('xbox', g.id)}
                      title={g.title}
                      aria-label={g.title}
                      className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                    >
                      <GameIcon source="xbox" id={g.id} imageUrl={g.imageIcon} size={32} className="w-8 h-8 rounded-box-sm hover:scale-110 transition-transform" />
                    </Link>
                  ))}
                  {games.length > PREVIEW && (
                    <Link
                      href={`/${slug}`}
                      className="w-8 h-8 rounded-box-sm bg-bg-card/60 flex items-center justify-center text-[10px] text-text-secondary hover:text-text-main transition-colors"
                    >
                      +{games.length - PREVIEW}
                    </Link>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
