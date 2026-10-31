import { useLanguage } from '@/context/LanguageContext'
import { decimal, plural } from '@/utils/utils'
import { CountUp } from '@/components/ui/CountUp'

const TILE = 'bg-bg-main rounded-pane px-4 py-3.5 flex flex-col min-w-0'
const LABEL = 'text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-text-secondary truncate'
const VALUE = 'text-[1.875rem] leading-tight font-extrabold tabular-nums'

/** Four numbers about the year, as tiles: days played, the average streak, the last achievement, the longest break. */
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
  // "day" or "days" for this number, without it: the number is the tile's figure.
  const unit = (n: number) => plural(n, T.plurals.days, lang).replace(n.toLocaleString(lang), '').trim()
  const tiles = [
    { label: T.streak.activeDays, value: <CountUp value={activeDays} locale={lang} />, sub: T.streak.inLastYear },
    { label: T.streak.avgStreak, value: decimal(avgStreak, lang), sub: T.streak.daysUnit },
    {
      label: T.streak.sinceLast,
      value: daysSinceLast === null ? '—' : daysSinceLast === 0 ? T.streak.today : daysSinceLast.toLocaleString(lang),
      sub: daysSinceLast === 0 ? T.streak.stillAlive : daysSinceLast === null ? '' : unit(daysSinceLast),
      accent: daysSinceLast === 0 ? 'text-success' : '',
    },
    { label: T.streak.longestGap, value: <CountUp value={longestGap} locale={lang} />, sub: unit(longestGap) },
  ]

  return (
    <dl className="grid grid-cols-2 gap-2.5 lg:w-[22rem] shrink-0 enter-cards">
      {tiles.map((t) => (
        <div key={t.label} className={TILE}>
          <dt className={LABEL}>{t.label}</dt>
          <dd className={`${VALUE} ${t.accent ?? ''}`}>{t.value}</dd>
          {t.sub && <dd className="text-[0.8125rem] text-text-secondary truncate">{t.sub}</dd>}
        </div>
      ))}
    </dl>
  )
}
