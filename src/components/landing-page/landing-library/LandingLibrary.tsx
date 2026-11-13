'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { SAMPLE_GAMES } from '@/components/landing-page/landingSamples'
import LandingSectionHead from '@/components/landing-page/landing-section-head/LandingSectionHead'
import LandingSampleGame from '@/components/landing-page/landing-sample-game/LandingSampleGame'
import Kicker from '@/components/ui/Kicker'
import Tabs, { tabIds } from '@/components/ui/Tabs'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { GameSource } from '@/types/game'

type Shown = 'all' | GameSource

/**
 * "One library, every platform": the text, and beside it an example of the library's list with its
 * platform tabs, which work. The list keeps its room whichever tab is on, so the page never jumps.
 */
export default function LandingLibrary() {
  const { T } = useLanguage()
  const [shown, setShown] = useState<Shown>('all')
  const games = SAMPLE_GAMES.filter((g) => shown === 'all' || g.source === shown)
  const ids = tabIds('landing-library', shown)

  return (
    <section id="que-es" className="grid gap-8 lg:grid-cols-[minmax(0,27.5rem)_minmax(0,1fr)] lg:gap-18 lg:items-center scroll-mt-6">
      <LandingSectionHead title={T.landing.libraryTitle} text={T.landing.libraryText} />
      <div className="flex flex-col gap-3 sm:bg-bg-card sm:rounded-card sm:ring-1 sm:ring-inset sm:ring-ink/[0.06] sm:p-5 lg:p-6">
        <Kicker>{T.landing.example}</Kicker>
        <Tabs
          id="landing-library"
          aria-label={T.rankings.platform}
          size="sm"
          value={shown}
          onChange={setShown}
          tabs={[
            { value: 'all', label: T.rankings.allPlatforms },
            ...(['ra', 'steam', 'psn'] as const).map((s) => ({ value: s, label: PLATFORM_NAME[s] })),
          ]}
          className="max-sm:hidden"
        />
        <div role="tabpanel" id={ids.panel} aria-labelledby={ids.tab} className="sm:min-h-[31.5rem]">
          <ul className="grid grid-cols-3 gap-x-3 gap-y-4 sm:flex sm:flex-col sm:gap-2">
            {games.map((g) => (
              <LandingSampleGame key={g.title} game={g} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
