'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { SAMPLE_GAMES } from '@/components/landing-page/landingSamples'
import LandingSectionHead from '@/components/landing-page/landing-section-head/LandingSectionHead'
import LandingSampleGame from '@/components/landing-page/landing-sample-game/LandingSampleGame'
import Kicker from '@/components/ui/Kicker'
import Tabs, { tabIds } from '@/components/ui/Tabs'
import { PLATFORM_NAME } from '@/utils/gameRef'
import { FEED_VIEW_MOTION, feedViewTransition } from '@/utils/feedViewMotion'
import type { GameSource } from '@/types/game'

type Shown = 'all' | GameSource

/**
 * "One library, every platform": the text on one half, on the other an example of the library with its platform tabs,
 * which work. Its games are the home's rows (the owner, 2026-11-13: "lo mismo que se ve en la main page"): one opens on
 * its achievements as the home's do, and the others step aside until it closes, as the home's feed does, with its swap
 * (the list leaves, then the opened game comes in: `feedViewMotion`).
 */
export default function LandingLibrary() {
  const { T } = useLanguage()
  const [shown, setShown] = useState<Shown>('all')
  const [open, setOpen] = useState<string | null>(null)
  // The swap between the list and an opened game animates only once someone has opened one: nothing moves on a load.
  const [toggled, setToggled] = useState(false)
  const reduce = useReducedMotion()
  const games = SAMPLE_GAMES.filter((g) => (shown === 'all' || g.source === shown) && (open === null || g.title === open))
  const ids = tabIds('landing-library', shown)

  return (
    <section id="que-es" className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-18 lg:items-center scroll-mt-20 short:scroll-mt-6">
      <LandingSectionHead title={T.landing.libraryTitle} text={T.landing.libraryText} points={T.landing.libraryPoints} />
      <div className="min-w-0 flex flex-col gap-3 bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06] p-3 sm:p-5 lg:p-6">
        <Kicker>{T.landing.example}</Kicker>
        <Tabs
          id="landing-library"
          aria-label={T.rankings.platform}
          size="sm"
          value={shown}
          onChange={(v) => {
            setShown(v)
            setOpen(null)
          }}
          tabs={[
            { value: 'all', label: T.rankings.allPlatforms },
            ...(['ra', 'steam', 'psn'] as const).map((s) => ({ value: s, label: PLATFORM_NAME[s] })),
          ]}
        />
        <div role="tabpanel" id={ids.panel} aria-labelledby={ids.tab} className="min-h-[31.5rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.ul
              key={open ?? 'list'}
              {...FEED_VIEW_MOTION}
              initial={toggled ? FEED_VIEW_MOTION.initial : false}
              transition={feedViewTransition(reduce)}
              className="flex flex-col gap-2.5"
            >
              {games.map((g) => (
                <LandingSampleGame
                  key={g.title}
                  game={g}
                  open={open === g.title}
                  onToggle={() => {
                    setToggled(true)
                    setOpen((o) => (o === g.title ? null : g.title))
                  }}
                />
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
