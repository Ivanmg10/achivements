'use client'

import { useLanguage } from '@/context/LanguageContext'
import { SAMPLE_GROUPS } from '@/components/landing-page/landingSamples'
import LandingSectionHead from '@/components/landing-page/landing-section-head/LandingSectionHead'
import LandingGroupReel from '@/components/landing-page/landing-group-reel/LandingGroupReel'

/**
 * "Sorted your way": the text, then the example groups going by in a band across the page, as the closing's covers do
 * (the owner, 2026-11-13, a try: "a carousel like Trae tus juegos with the groups' cards in it"; revert if it does not
 * convince). The band reaches the page's edges.
 */
export default function LandingGroups() {
  const { T } = useLanguage()

  return (
    <section className="flex flex-col gap-8 lg:gap-12">
      <LandingSectionHead title={T.landing.organiseTitle} points={T.landing.organisePoints} />
      <div className="flex flex-col gap-3">
        <div className="-mx-4 sm:-mx-8 lg:-mx-24">
          <LandingGroupReel groups={SAMPLE_GROUPS} />
        </div>
      </div>
    </section>
  )
}
