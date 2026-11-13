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
 * "One library, every platform": the title with its line and points beside it, then an example of the library across
 * the page with its platform tabs, which work. Its games are the home's rows (the owner, 2026-11-13: "lo mismo que se ve
 * en la main page"): a Steam one opens on its achievements as the home's do, one at a time, so the example takes the
 * page's width (the opened layout needs it).
 */
export default function LandingLibrary() {
  const { T } = useLanguage()
  const [shown, setShown] = useState<Shown>('all')
  const [open, setOpen] = useState<string | null>(null)
  const games = SAMPLE_GAMES.filter((g) => shown === 'all' || g.source === shown)
  const ids = tabIds('landing-library', shown)

  return (
    <section id="que-es" className="flex flex-col gap-6 lg:gap-9 scroll-mt-20 short:scroll-mt-6">
      <LandingSectionHead title={T.landing.libraryTitle} text={T.landing.libraryText} points={T.landing.libraryPoints} row />
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
          <ul className="flex flex-col gap-2.5">
            {games.map((g) => (
              <LandingSampleGame key={g.title} game={g} open={open === g.title} onToggle={() => setOpen((o) => (o === g.title ? null : g.title))} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
