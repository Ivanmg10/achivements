import { useLanguage } from '@/context/LanguageContext'
import { plural } from '@/utils/utils'
import { StatPill } from '@/components/ui/StatPill'

/** Four numbers about the year: days played, the average streak, how long since the last achievement, the longest break. */
export default function StreakQuickStats({
  activeDays,
  avgStreak,
  daysSinceLast,
  longestGap,
}: {
  activeDays: number
  avgStreak: number
  daysSinceLast: number | null
  longestGap: number
}) {
  const { T, lang } = useLanguage()
  const days = (n: number) => plural(n, T.plurals.days, lang)

  return (
    <div className="flex flex-wrap gap-y-4">
      <StatPill label={T.streak.activeDays} value={activeDays.toLocaleString(lang)} sub={T.streak.inLastYear} />
      <StatPill label={T.streak.avgStreak} value={days(Math.round(avgStreak * 10) / 10)} />
      <StatPill
        label={T.streak.sinceLast}
        value={daysSinceLast === null ? '—' : daysSinceLast === 0 ? T.streak.today : days(daysSinceLast)}
        accent={daysSinceLast === 0 ? 'text-success' : 'text-text-main'}
      />
      <StatPill label={T.streak.longestGap} value={days(longestGap)} />
    </div>
  )
}
