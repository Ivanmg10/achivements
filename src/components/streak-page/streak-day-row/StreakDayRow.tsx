'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence } from 'framer-motion'
import { RecentAchievement, UserAward } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { useFitCount } from '@/hooks/useFitCount'
import { plural } from '@/utils/utils'
import Button from '@/components/ui/Button'
import Facts from '@/components/ui/Facts'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import StreakCompletionCard from '../streak-completion-card/StreakCompletionCard'
import StreakDayAchievements from '../streak-day-achievements/StreakDayAchievements'
import { formatDay } from '@/utils/dates'

// Downloaded the first time a day with more than fits is opened.
const DayAchievementsModal = dynamic(() => import('@/components/day-achievements-modal/DayAchievementsModal'), { loading: () => null })

/** Rows before the list is measured: what the stacked panel's fixed height holds under its head. */
const ROWS = 5
/** Games finished that day drawn as a card; any more are in "See more". */
const MAX_AWARDS = 1

interface Props {
  date: string
  today: string
  achievements: RecentAchievement[]
  awards?: UserAward[]
}

/**
 * The day picked in a streak: the day in big, how many were unlocked (and
 * "today" when it is) and the games on one line, a game finished that day, then
 * as many achievements as fit, whole rows only; "See more" opens the whole day.
 * It never sets the height: beside the calendar it takes the calendar's, stacked
 * under it a fixed one, so picking another day moves nothing.
 */
export default function StreakDayRow({ date, today, achievements, awards = [] }: Props) {
  const { T, lang } = useLanguage()
  const [modalOpen, setModalOpen] = useState(false)
  const [list, fits] = useFitCount<HTMLUListElement>(ROWS)
  const games = [...new Set(achievements.map((a) => a.GameTitle))].join(', ')
  const shownAwards = awards.slice(0, MAX_AWARDS)
  const more = achievements.length > fits || awards.length > MAX_AWARDS

  return (
    // The content is absolute, so the panel adds nothing to its row's height: 388 px stacked (its head and five rows).
    <div className="relative flex-1 min-w-0 @3xl:min-w-72 self-stretch h-[24.25rem] @3xl:h-auto">
      <div className="absolute inset-0 overflow-hidden flex flex-col gap-4 rounded-pane bg-bg-main p-4 sm:p-5">
        <div className="flex items-center gap-4 min-w-0 shrink-0">
          <span aria-hidden="true" className="flex flex-col items-center shrink-0 w-12">
            <span className="font-display italic font-extrabold text-[2.5rem] leading-none tabular-nums pr-1">{formatDay(date, lang, { day: 'numeric' })}</span>
            <span className="text-[0.8125rem] text-text-secondary">{formatDay(date, lang, { month: 'short' })}</span>
          </span>
          <span className="flex flex-col gap-0.5 min-w-0 flex-1">
            <h3 className="text-lg font-bold">
              <span className="sr-only">{formatDay(date, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}: </span>
              <Facts items={[plural(achievements.length, T.plurals.achievements, lang), date === today && T.streak.today.toLowerCase()]} />
            </h3>
            {games && (
              <span title={games} className="text-sm text-text-secondary truncate">
                {games}
              </span>
            )}
          </span>
          {more && (
            <Button variant="secondary" size="sm" className="shrink-0" onClick={() => setModalOpen(true)}>
              {T.streak.dayMore}
            </Button>
          )}
        </div>

        {shownAwards.length > 0 && (
          <div className="flex flex-col gap-1.5 shrink-0">
            {shownAwards.map((award) => (
              <StreakCompletionCard key={`${award.AwardType}-${award.AwardData}`} award={award} />
            ))}
          </div>
        )}

        <div className="relative flex-1 min-h-0">
          <StreakDayAchievements ref={list} achievements={achievements.slice(0, fits)} className="absolute inset-0 overflow-hidden" />
        </div>

        <LazyWhenOpened open={modalOpen}>
          <AnimatePresence>
            {modalOpen && <DayAchievementsModal date={date} achievements={achievements} onClose={() => setModalOpen(false)} />}
          </AnimatePresence>
        </LazyWhenOpened>
      </div>
    </div>
  )
}
