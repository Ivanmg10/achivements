'use client'

import { RecentAchievement, UserAward } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { plural } from '@/utils/utils'
import StreakCompletionCard from '../streak-completion-card/StreakCompletionCard'
import StreakDayAchievements from '../streak-day-achievements/StreakDayAchievements'
import { formatDay } from '@/utils/dates'

interface Props {
  date: string
  today: string
  achievements: RecentAchievement[]
  awards?: UserAward[]
}

/**
 * The day picked in a streak, beside its calendar: the day in big, how many
 * were unlocked (and "today" when it is) and the games, a game finished that
 * day, then what was unlocked.
 */
export default function StreakDayRow({ date, today, achievements, awards = [] }: Props) {
  const { T, lang } = useLanguage()
  const games = [...new Set(achievements.map((a) => a.GameTitle))]

  return (
    <div className="flex-1 min-w-0 self-stretch @3xl:self-start flex flex-col gap-4 rounded-pane bg-bg-main p-4 sm:p-5">
      <div className="flex items-center gap-4 min-w-0">
        <span aria-hidden="true" className="flex flex-col items-center shrink-0 w-12">
          <span className="font-display italic font-extrabold text-[2.5rem] leading-none tabular-nums pr-1">{formatDay(date, lang, { day: 'numeric' })}</span>
          <span className="text-[0.8125rem] text-text-secondary">{formatDay(date, lang, { month: 'short' })}</span>
        </span>
        <span className="flex flex-col gap-0.5 min-w-0 flex-1">
          <h3 className="text-lg font-bold">
            <span className="sr-only">{formatDay(date, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}: </span>
            {plural(achievements.length, T.plurals.achievements, lang)}
            {date === today && ` · ${T.streak.today.toLowerCase()}`}
          </h3>
          {games.length > 0 && <span className="text-sm text-text-secondary truncate">{games.join(', ')}</span>}
        </span>
      </div>

      {awards.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {awards.map((award) => (
            <StreakCompletionCard key={`${award.AwardType}-${award.AwardData}`} award={award} />
          ))}
        </div>
      )}

      {achievements.length > 0 && <StreakDayAchievements date={date} achievements={achievements} />}
    </div>
  )
}
