'use client'

import { useMemo, useState } from 'react'
import { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { allRa, groupDays } from '@/utils/periodDays'
import { plural } from '@/utils/utils'
import PeriodAchievementsDays from '@/components/period-achievements-days/PeriodAchievementsDays'
import PeriodAchievementsDay from '@/components/period-achievements-day/PeriodAchievementsDay'
import Modal from '@/components/ui/Modal'
import Facts from '@/components/ui/Facts'

interface Props {
  title: string
  /** A line under the title (the week's first day). */
  hint?: string
  /** What the empty state says. */
  empty?: string
  achievements: RecentAchievement[]
  onClose: () => void
}

/**
 * The unlocks of a week, a month or any stretch: the one dialog the best-period cards open. From `lg` two panes,
 * the days (newest first, the newest chosen on open) and the chosen day grouped by game; below `lg` the same as
 * steps, the days first and a day with a way back. The footer keeps the period's total.
 */
export default function PeriodAchievementsModal({ title, hint, empty, achievements, onClose }: Props) {
  const { T, lang } = useLanguage()
  const [chosen, setChosen] = useState<string | null>(null)
  // Below `lg` only one pane shows: the days, or the day just tapped.
  const [step, setStep] = useState<'days' | 'day'>('days')
  const days = useMemo(() => groupDays(achievements), [achievements])
  const day = days.find((d) => d.date === chosen) ?? days[0]
  const points = achievements.reduce((sum, a) => sum + a.Points, 0)

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="xl"
      title={title}
      hint={hint}
      className="gap-4"
      footer={
        achievements.length > 0 ? (
          <p className="flex flex-wrap items-center text-xs text-text-secondary">
            <Facts items={[plural(achievements.length, T.plurals.achievements, lang), allRa(achievements) && plural(points, T.plurals.points, lang)]} />
          </p>
        ) : undefined
      }
    >
      {!day ? (
        <p className="text-sm text-text-secondary text-center py-6">{empty ?? T.cards.noData}</p>
      ) : (
        // Its height is what the screen leaves (the head and footer take about 13rem), and never more than a
        // wide dialog: at 2560x1300 and 1920x1080 it stays wider than tall.
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:h-[max(16rem,min(44rem,calc(85dvh-13rem)))]">
          <div className={`${step === 'day' ? 'hidden lg:flex' : 'flex'} flex-col min-w-0 lg:min-h-0`}>
            <PeriodAchievementsDays
              days={days}
              selected={day.date}
              onSelect={(date) => {
                setChosen(date)
                setStep('day')
              }}
            />
          </div>
          <div className={`${step === 'day' ? 'flex' : 'hidden lg:flex'} flex-col gap-3 min-w-0 lg:min-h-0 lg:pl-4 lg:shadow-hairline-l`}>
            <PeriodAchievementsDay key={day.date} day={day} onNavigate={onClose} onBack={() => setStep('days')} />
          </div>
        </div>
      )}
    </Modal>
  )
}
