import { useLanguage } from '@/context/LanguageContext'
import { plural } from '@/utils/utils'
import { StatPill } from '@/components/ui/StatPill'

// A card like the rest of the page's: StatPill's own surface is the page's colour.
const CARD = 'bg-bg-card! rounded-2xl py-4'

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatPill className={CARD} label={T.streak.activeDays} value={activeDays.toLocaleString(lang)} sub={T.streak.inLastYear} accent="text-accent" />
      <StatPill className={CARD} label={T.streak.avgStreak} value={days(Math.round(avgStreak * 10) / 10)} accent="text-info" />
      <StatPill
        className={CARD}
        label={T.streak.sinceLast}
        value={daysSinceLast === null ? '—' : daysSinceLast === 0 ? T.streak.today : days(daysSinceLast)}
        accent={daysSinceLast === 0 ? 'text-success' : 'text-text-main'}
      />
      <StatPill className={CARD} label={T.streak.longestGap} value={days(longestGap)} accent="text-warning" />
    </div>
  )
}
