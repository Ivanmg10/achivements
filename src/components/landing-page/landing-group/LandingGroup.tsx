'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { SampleGroup } from '@/components/landing-page/landingSamples'
import { ProgressBar } from '@/components/ui/ProgressBar'
import Facts from '@/components/ui/Facts'
import GroupCoverStrip from '@/components/groups/group-cover-strip/GroupCoverStrip'
import { plural } from '@/utils/utils'

/**
 * One example group: the band across the top split between its games' covers (`GroupCoverStrip`, as a real group's
 * card), the name over it in the display italic and how far along it is, then its bar and what it holds. Not a link:
 * it is an example.
 */
export default function LandingGroup({ group }: { group: SampleGroup }) {
  const { T, lang } = useLanguage()
  const pct = Math.round((group.earned / group.total) * 100)
  const name = group.named ? T.landing[group.named] : group.name

  return (
    <article className="relative flex flex-col bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06] overflow-hidden">
      <div className="relative h-32 sm:h-40 overflow-hidden">
        <GroupCoverStrip covers={group.covers} />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-transparent from-40% to-bg-main/90" />
        <div className="absolute inset-x-4 bottom-2.5 lg:inset-x-5 lg:bottom-3.5 flex items-end justify-between gap-3">
          <h3 className="font-display italic font-extrabold text-[1.75rem] lg:text-[2.5rem] leading-none truncate pr-1">{name}</h3>
          <span className="text-lg lg:text-2xl font-extrabold tabular-nums">{pct}%</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 px-4 pt-3.5 pb-4 lg:px-5 lg:pb-5">
        <ProgressBar pct={pct} label={name} />
        <p className="text-[0.8125rem] lg:text-sm text-text-secondary truncate">
          <Facts
            items={[
              plural(group.games, T.plurals.games, lang),
              T.gameInfoPage.ofAchievements.replace('{n}', group.earned.toLocaleString(lang)).replace('{total}', group.total.toLocaleString(lang)),
            ]}
          />
        </p>
      </div>
    </article>
  )
}
