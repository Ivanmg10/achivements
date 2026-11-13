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
 * platform tabs, which work, the same list on a phone as on a desk (the owner, 2026-11-13: as in the app itself). The list keeps its room whichever tab is on, so the page never jumps.
 */
export default function LandingLibrary() {
  const { T } = useLanguage()
  const [shown, setShown] = useState<Shown>('all')
  const games = SAMPLE_GAMES.filter((g) => shown === 'all' || g.source === shown)
  const ids = tabIds('landing-library', shown)

  return (
    <section id="que-es" className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,27.5rem)_minmax(0,1fr)] lg:gap-18 lg:items-center scroll-mt-20 short:scroll-mt-6">
      <LandingSectionHead title={T.landing.libraryTitle} text={T.landing.libraryText} points={T.landing.libraryPoints} />
      <div className="min-w-0 flex flex-col gap-3 bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06] p-3 sm:p-5 lg:p-6">
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
        />
        <div role="tabpanel" id={ids.panel} aria-labelledby={ids.tab} className="min-h-[31.5rem]">
          <ul className="flex flex-col gap-2">
            {games.map((g) => (
              <LandingSampleGame key={g.title} game={g} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
