'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useScrollFade } from '@/hooks/useScrollFade'
import { SAMPLE_GROUPS } from '@/components/landing-page/landingSamples'
import LandingSectionHead from '@/components/landing-page/landing-section-head/LandingSectionHead'
import LandingGroup from '@/components/landing-page/landing-group/LandingGroup'
import Kicker from '@/components/ui/Kicker'

/**
 * "Sorted your way": the title with its line beside it, then three example groups in a row. Below `lg`
 * the groups are a strip that scrolls sideways and fades where it is cut.
 */
export default function LandingGroups() {
  const { T } = useLanguage()
  const { ref, fade } = useScrollFade()

  return (
    <section className="flex flex-col gap-6 lg:gap-9">
      <LandingSectionHead title={T.landing.organiseTitle} points={T.landing.organisePoints} row />
      <div className="flex flex-col gap-3">
        <Kicker>{T.landing.example}</Kicker>
        <div ref={ref} className={`-mx-4 px-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0 flex gap-3.5 overflow-x-auto snap-x [scrollbar-width:none] lg:grid lg:grid-cols-3 lg:gap-7 lg:overflow-visible ${fade}`}>
          {SAMPLE_GROUPS.map((g) => (
            <div key={g.name} className="shrink-0 w-[18.75rem] snap-start lg:w-auto">
              <LandingGroup group={g} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
