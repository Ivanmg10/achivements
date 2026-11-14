'use client'

import type { ReactNode } from 'react'
import { IconArrowLeft } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useScrollFade } from '@/hooks/useScrollFade'
import { formatWeekdayDay } from '@/utils/dates'
import { plural } from '@/utils/utils'
import type { DayGroup } from '@/utils/periodDays'
import PeriodAchievementsGameGroup from '@/components/period-achievements-game-group/PeriodAchievementsGameGroup'
import Facts from '@/components/ui/Facts'

/**
 * One day's unlocks, grouped by game: the right pane of the week and month dialogs and the whole of the day's
 * dialog (`hideHead`, as its own head already says the day). From `lg` it scrolls inside the height its parent
 * gives; below, it is a step of its own with `onBack` to the days. `above` sits over the games (the day's awards).
 */
export default function PeriodAchievementsDay({
  day,
  onNavigate,
  onBack,
  hideHead = false,
  above,
}: {
  day: DayGroup
  onNavigate: () => void
  onBack?: () => void
  hideHead?: boolean
  above?: ReactNode
}) {
  const { T, lang } = useLanguage()
  const { ref, fade } = useScrollFade({ axis: 'y' })

  return (
    <>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="lg:hidden self-start flex items-center gap-1 text-xs text-text-secondary hover:text-text-main rounded focus-ring"
        >
          <IconArrowLeft size={14} aria-hidden="true" />
          {T.dayModal.back}
        </button>
      )}
      {!hideHead && (
        <div>
          <h3 className="text-base font-bold leading-snug">{formatWeekdayDay(day.date, lang)}</h3>
          <p className="flex flex-wrap items-center text-xs text-text-secondary">
            <Facts items={[plural(day.count, T.plurals.achievements, lang), day.hasPoints && plural(day.points, T.plurals.points, lang)]} />
          </p>
        </div>
      )}
      <div ref={ref} className={`flex flex-col gap-4 lg:overflow-y-auto lg:overscroll-contain lg:min-h-0 lg:flex-1 -mx-1 px-1 ${fade}`}>
        {above}
        {day.games.length > 0 && (
          <ul className="flex flex-col gap-5 enter-rows">
            {day.games.map((group) => (
              <li key={group.key}>
                <PeriodAchievementsGameGroup group={group} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
