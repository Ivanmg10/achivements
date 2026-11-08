'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import { Skeleton } from '@/components/ui/Skeleton'
import Kicker from '@/components/ui/Kicker'

const PREVIEW = 6

const SECTIONS = [
  { slug: 'wantToPlay', emoji: '🔖' },
  { slug: 'playing', emoji: '🎮' },
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
      <Kicker>{T.cards.navigation}</Kicker>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SECTIONS.map(({ slug, emoji }) => {
          const { games } = sections[slug]
          return (
            <div key={slug} className="bg-bg-main rounded-box p-3 flex flex-col gap-2.5">
              <Link
                href={`/${slug}`}
                className="flex items-center justify-between group focus-ring rounded"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-sm leading-none" aria-hidden="true">{emoji}</span>
                  <span className="text-xs font-semibold text-text-main group-hover:text-accent transition-colors">
                    {T.categories[slug]}
                  </span>
                </span>
                <span className="text-[10px] font-semibold text-steam tabular-nums">{loading ? '—' : games.length}</span>
              </Link>

              {loading ? (
                <div className="flex gap-1.5" aria-busy="true">
                  {[0, 1, 2, 3].map((i) => <Skeleton key={i} radius="tag" className="w-8 h-8" />)}
                </div>
              ) : games.length === 0 ? (
                <p className="text-[10px] text-text-secondary">{T.steam.noGamesInCategory}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {games.slice(0, PREVIEW).map((g) => (
                    <Link
                      key={g.id}
                      href={`/steamGame/${g.id}`}
                      title={g.title}
                      aria-label={g.title}
                      className="rounded focus-ring"
                    >
                      {g.imageIcon ? (
                        <Image src={g.imageIcon} alt="" width={32} height={32} className="rounded-box-sm hover:scale-110 transition-transform" />
                      ) : (
                        <span className="block w-8 h-8 rounded-box-sm bg-ink/10" aria-hidden="true" />
                      )}
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
