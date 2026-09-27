'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'

const PREVIEW = 6

const SECTIONS = [
  { slug: 'playing', emoji: '🎮' },
  { slug: 'wantToPlay', emoji: '🔖' },
  { slug: 'completed', emoji: '🏆' },
] as const

/**
 * Steam's side of the navigation card. Steam has no consoles to split by, so
 * each section shows how many Steam games it holds and the first few, linking
 * to the category page (where Steam has its own section) and to each game.
 */
export default function MainPageSteamNav() {
  const { T } = useLanguage()
  const sections = {
    playing: useSteamGamesByCategory('playing'),
    wantToPlay: useSteamGamesByCategory('wantToPlay'),
    completed: useSteamGamesByCategory('completed'),
  }
  const loading = sections.playing.loading

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.navigation}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SECTIONS.map(({ slug, emoji }) => {
          const { games } = sections[slug]
          return (
            <div key={slug} className="bg-bg-main rounded-lg p-3 flex flex-col gap-2.5">
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
                <span className="text-[10px] font-semibold text-[#66c0f4] tabular-nums">{loading ? '—' : games.length}</span>
              </Link>

              {loading ? (
                <div className="flex gap-1.5 animate-pulse" aria-busy="true">
                  {[0, 1, 2, 3].map((i) => <div key={i} className="w-8 h-8 rounded bg-white/10" />)}
                </div>
              ) : games.length === 0 ? (
                <p className="text-[10px] text-text-secondary/60">{T.steam.noGamesInCategory}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {games.slice(0, PREVIEW).map((g) => (
                    <Link
                      key={g.id}
                      href={`/steamGame/${g.id}`}
                      title={g.title}
                      aria-label={g.title}
                      className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                    >
                      {g.imageIcon ? (
                        <Image src={g.imageIcon} alt="" width={32} height={32} className="rounded hover:scale-110 transition-transform" />
                      ) : (
                        <span className="block w-8 h-8 rounded bg-white/10" aria-hidden="true" />
                      )}
                    </Link>
                  ))}
                  {games.length > PREVIEW && (
                    <Link
                      href={`/${slug}`}
                      className="w-8 h-8 rounded bg-bg-card/60 flex items-center justify-center text-[10px] text-text-secondary hover:text-text-main transition-colors"
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
