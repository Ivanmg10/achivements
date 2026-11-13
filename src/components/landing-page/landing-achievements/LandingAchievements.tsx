'use client'

import { useState } from 'react'
import { IconSparkles } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { SAMPLE_ACHIEVEMENTS } from '@/components/landing-page/landingSamples'
import LandingSectionHead from '@/components/landing-page/landing-section-head/LandingSectionHead'
import LandingSampleGameHead from '@/components/landing-page/landing-sample-game-head/LandingSampleGameHead'
import LandingSampleAchievement from '@/components/landing-page/landing-sample-achievement/LandingSampleAchievement'
import Button from '@/components/ui/Button'
import Kicker from '@/components/ui/Kicker'
import Tabs, { tabIds } from '@/components/ui/Tabs'
import { REGISTER_HREF } from '@/utils/authLinks'
import { addDays, utcDay } from '@/utils/dates'

type Shown = 'all' | 'earned' | 'locked'

/**
 * "Achievement by achievement" (round five, the owner's pick "B", 2026-11-13): what the section adds in points,
 * and beside it an example of a game page, Black Ops II on Steam: its top, the filters (which work), the AI
 * button (it leads to sign-up: the export needs an account) and six real achievements with Steam's names, icons
 * and rarity. The list keeps its room whichever filter is on, so the page never jumps.
 */
export default function LandingAchievements() {
  const { T } = useLanguage()
  const [shown, setShown] = useState<Shown>('all')
  const [today] = useState(() => utcDay(Date.now()))
  const ids = tabIds('landing-achievements', shown)
  const rows = SAMPLE_ACHIEVEMENTS.map((a, i) => ({
    ...a,
    ...T.landing.sampleAchievements[i],
    earnedAt: a.daysAgo === null ? null : `${addDays(today, -a.daysAgo)} 18:00:00`,
  }))
  const listed = rows.filter((r) => shown === 'all' || (shown === 'earned') === (r.earnedAt !== null))

  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:gap-18 lg:items-center">
      <LandingSectionHead title={T.landing.achievementsTitle} points={T.landing.achievementsPoints} />
      <div className="min-w-0 flex flex-col gap-3">
        <Kicker>{T.landing.example}</Kicker>
        <div className="bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06] overflow-hidden">
          <LandingSampleGameHead />
          <div className="px-4 sm:px-6 pb-3 sm:pb-4 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-1 shadow-hairline-b">
              <Tabs
                id="landing-achievements"
                aria-label={T.userGame.filtersLabel}
                size="sm"
                value={shown}
                onChange={setShown}
                tabs={[
                  { value: 'all', label: T.userGame.filterAll },
                  { value: 'earned', label: T.userGame.filterEarned },
                  { value: 'locked', label: T.userGame.filterLocked },
                ]}
              />
              <Button href={REGISTER_HREF} variant="secondary" size="sm">
                <IconSparkles size={16} aria-hidden="true" />
                {T.aiExport.open}
              </Button>
            </div>
            <div role="tabpanel" id={ids.panel} aria-labelledby={ids.tab} className="min-h-[27.5rem] sm:min-h-[26rem]">
              <ul>
                {listed.map((r) => (
                  <LandingSampleAchievement key={r.icon} icon={r.icon} name={r.name} text={r.text} rarity={r.rarity} earnedAt={r.earnedAt} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
