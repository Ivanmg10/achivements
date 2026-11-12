import { Skeleton } from '@/components/ui/Skeleton'
import { CALENDAR_COLUMNS } from '../streak-calendar/StreakCalendar'

// Eight weeks: about a long streak's calendar, so the card keeps its room when it lands.
const CELLS = 56

/** "The streak, day by day" while the year loads: the weekday row, the days and the picked day's panel, on the real boxes. */
export default function StreakCalendarSkeleton() {
  return (
    <div aria-hidden="true" className="@container">
      <div className="flex flex-col @3xl:flex-row gap-6 @3xl:gap-10">
        <div className="flex flex-col gap-2 w-full max-w-[27.5rem] shrink-0">
          <div className={CALENDAR_COLUMNS}>
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-3.5" />
            ))}
          </div>
          <div className={CALENDAR_COLUMNS}>
            {Array.from({ length: CELLS }, (_, i) => (
              <Skeleton key={i} radius="tile" className="aspect-square" />
            ))}
          </div>
          <Skeleton className="h-3 w-32 mt-1" />
        </div>
        <Skeleton radius="pane" className="flex-1 h-72" />
      </div>
    </div>
  )
}
