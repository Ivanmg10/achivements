'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { GameSource } from '@/types/game'
import Kicker from '@/components/ui/Kicker'
import { BROWSE_SECTIONS, type BrowseSlug } from '../browseSections'
import MainPagePlatformNavSection, { type NavGame } from '../main-page-platform-nav-section/MainPagePlatformNavSection'

const COUNT_TONE = { steam: 'text-steam', psn: 'text-psn', xbox: 'text-success' } as const

/**
 * A platform's side of the navigation card. These platforms have no consoles to split by, so each list
 * shows how many of its games it holds and the first few, linking to the list's page and to each game.
 * The adapter reads its library (`sections`) and says what an empty list says.
 */
export default function MainPagePlatformNav({
  source,
  sections,
  empty,
}: {
  source: keyof typeof COUNT_TONE & Exclude<GameSource, 'ra'>
  sections: Record<BrowseSlug, { games: NavGame[]; loading: boolean }>
  empty: string
}) {
  const { T } = useLanguage()
  // The three lists come from one library: one is loading when all are.
  const loading = sections.playing.loading

  return (
    <div className="flex flex-col gap-3">
      <Kicker>{T.cards.navigation}</Kicker>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {BROWSE_SECTIONS.map(({ slug, emoji }) => (
          <MainPagePlatformNavSection
            key={slug}
            source={source}
            slug={slug}
            emoji={emoji}
            label={T.categories[slug]}
            countTone={COUNT_TONE[source]}
            games={sections[slug].games}
            loading={loading}
            empty={empty}
          />
        ))}
      </div>
    </div>
  )
}
