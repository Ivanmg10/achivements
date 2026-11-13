'use client'

import { useState } from 'react'
import LandingTopBar from '@/components/landing-page/landing-top-bar/LandingTopBar'
import LandingTitle from '@/components/landing-page/landing-title/LandingTitle'
import LandingLibrary from '@/components/landing-page/landing-library/LandingLibrary'
import LandingGroups from '@/components/landing-page/landing-groups/LandingGroups'
import LandingAchievements from '@/components/landing-page/landing-achievements/LandingAchievements'
import LandingStreak from '@/components/landing-page/landing-streak/LandingStreak'
import LandingPoints from '@/components/landing-page/landing-points/LandingPoints'
import LandingFaq from '@/components/landing-page/landing-faq/LandingFaq'
import LandingClosing from '@/components/landing-page/landing-closing/LandingClosing'
import EnterOnView from '@/components/ui/EnterOnView'
import PublicFooter from '@/components/public-footer/PublicFooter'

/**
 * What a visitor sees at the door (#136, canvas page 4): a game's title screen with the two ways in, then
 * what CheevoVault is, shown with the app's own pieces and labelled examples (the library, a game's achievements, the
 * groups going by, the streak, Vault Points and the rankings), the questions people ask first, and the art going by at the end with the ways in
 * again. Each part below the first screen enters as it is reached (`EnterOnView`). Its motion (the title's art,
 * the closing band) is CSS; the stop button holds all of it still.
 */
export default function LandingPage() {
  const [still, setStill] = useState(false)

  return (
    <div data-motion={still ? 'still' : undefined} className="min-h-[100dvh] bg-bg-main text-text-main flex flex-col">
      <LandingTopBar />
      <main className="flex flex-col">
        <LandingTitle still={still} onStill={() => setStill((s) => !s)} />
        <div className="w-full max-w-[110rem] mx-auto px-4 sm:px-8 lg:px-24 pt-18 lg:pt-30 pb-20 lg:pb-36 flex flex-col gap-20 lg:gap-40">
          <EnterOnView>
            <LandingLibrary />
          </EnterOnView>
          <EnterOnView>
            <LandingAchievements />
          </EnterOnView>
          <EnterOnView>
            <LandingGroups />
          </EnterOnView>
          <EnterOnView>
            <LandingStreak />
          </EnterOnView>
          <EnterOnView>
            <LandingPoints />
          </EnterOnView>
          <EnterOnView>
            <LandingFaq />
          </EnterOnView>
        </div>
        <EnterOnView>
          <LandingClosing />
        </EnterOnView>
      </main>
      <PublicFooter />
    </div>
  )
}
