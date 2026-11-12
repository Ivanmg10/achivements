import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import IconButton from '@/components/ui/IconButton'
import { formatDay } from '@/utils/dates'

/** Over the streak calendar: the weeks shown, as "8 Sept – 11 Nov", between the buttons to the earlier and later weeks. */
export default function StreakCalendarNav({
  from,
  to,
  onPrev,
  onNext,
}: {
  from: string
  to: string
  /** Null at the streak's first weeks: the button is disabled. */
  onPrev: (() => void) | null
  onNext: (() => void) | null
}) {
  const { T, lang } = useLanguage()
  return (
    <div className="flex items-center gap-1">
      <IconButton size="sm" aria-label={T.streak.prevWeeks} disabled={!onPrev} onClick={onPrev ?? undefined}>
        <IconChevronLeft className="w-4 h-4" aria-hidden="true" />
      </IconButton>
      <span aria-live="polite" className="min-w-0 text-[0.8125rem] font-semibold tabular-nums text-center px-1">
        {formatDay(from, lang)} – {formatDay(to, lang)}
      </span>
      <IconButton size="sm" aria-label={T.streak.nextWeeks} disabled={!onNext} onClick={onNext ?? undefined}>
        <IconChevronRight className="w-4 h-4" aria-hidden="true" />
      </IconButton>
    </div>
  )
}
