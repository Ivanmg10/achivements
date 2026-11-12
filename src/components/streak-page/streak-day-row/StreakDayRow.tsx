'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence } from 'framer-motion'
import { RecentAchievement, UserAward } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { plural } from '@/utils/utils'
import Button from '@/components/ui/Button'
import Facts from '@/components/ui/Facts'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import StreakCompletionCard from '../streak-completion-card/StreakCompletionCard'
import StreakDayAchievements from '../streak-day-achievements/StreakDayAchievements'
import { formatDay } from '@/utils/dates'

// Downloaded the first time a day with more than fits is opened.
const DayAchievementsModal = dynamic(() => import('@/components/day-achievements-modal/DayAchievementsModal'), { loading: () => null })

/** Rows the panel lists, a game finished that day taking one: five fit beside the calendar's seven rows. */
const ROWS = 5

interface Props {
  date: string
  today: string
  achievements: RecentAchievement[]
  awards?: UserAward[]
}

/**
 * The day picked in a streak, beside its calendar and as tall: the day in big,
 * how many were unlocked (and "today" when it is) and the games on one line, a
 * game finished that day, then the first achievements; "See more" opens the
 * whole day.
 */
export default function StreakDayRow({ date, today, achievements, awards = [] }: Props) {
  const { T, lang } = useLanguage()
  const [modalOpen, setModalOpen] = useState(false)
  const games = [...new Set(achievements.map((a) => a.GameTitle))].join(', ')
  const limit = Math.max(1, ROWS - awards.length)

  return (
    <div className="flex-1 min-w-0 @3xl:min-w-72 self-stretch flex flex-col gap-4 rounded-pane bg-bg-main p-4 sm:p-5">
      <div className="flex items-center gap-4 min-w-0">
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
        {achievements.length > limit && (
          <Button variant="secondary" size="sm" className="shrink-0" onClick={() => setModalOpen(true)}>
            {T.streak.dayMore}
          </Button>
        )}
      </div>

      {awards.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {awards.map((award) => (
            <StreakCompletionCard key={`${award.AwardType}-${award.AwardData}`} award={award} />
          ))}
        </div>
      )}

      {achievements.length > 0 && <StreakDayAchievements achievements={achievements.slice(0, limit)} />}

      <LazyWhenOpened open={modalOpen}>
        <AnimatePresence>
          {modalOpen && <DayAchievementsModal date={date} achievements={achievements} onClose={() => setModalOpen(false)} />}
        </AnimatePresence>
      </LazyWhenOpened>
    </div>
  )
}
