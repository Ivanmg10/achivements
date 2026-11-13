'use client'

import { useLanguage } from '@/context/LanguageContext'
import { SAMPLE_GROUPS } from '@/components/landing-page/landingSamples'
import LandingSectionHead from '@/components/landing-page/landing-section-head/LandingSectionHead'
import LandingGroup from '@/components/landing-page/landing-group/LandingGroup'
import Kicker from '@/components/ui/Kicker'

/**
 * "Sorted your way": three example groups one under another on one half, the text on the other, on the right (the
 * owner, 2026-11-13: half and half, the sections in a zigzag).
 */
export default function LandingGroups() {
  const { T } = useLanguage()

  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-18 lg:items-center">
      <LandingSectionHead title={T.landing.organiseTitle} points={T.landing.organisePoints} end />
      <div className="min-w-0 flex flex-col gap-3">
        <Kicker>{T.landing.example}</Kicker>
        <ul className="flex flex-col gap-3.5 lg:gap-4">
          {SAMPLE_GROUPS.map((g) => (
            <li key={g.name}>
              <LandingGroup group={g} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
