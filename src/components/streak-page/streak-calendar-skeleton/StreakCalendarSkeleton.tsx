import { Skeleton } from '@/components/ui/Skeleton'
import { CALENDAR_GRID, calendarColumns } from '../streak-calendar/StreakCalendar'

// Ten weeks: about a long streak's calendar, so the card keeps its room when it lands.
const WEEKS = 10

/** "The streak, day by day" while the year loads, in the calendar's own grid: the months, the weekdays, seven rows of days, the legend and the picked day's panel. */
export default function StreakCalendarSkeleton() {
  return (
    <div aria-hidden="true" className="@container">
      <div className="flex flex-col @3xl:flex-row gap-6 @3xl:gap-10">
        <div className="flex flex-col gap-2 min-w-0 max-w-full overflow-hidden">
          <div className={CALENDAR_GRID} style={calendarColumns(WEEKS)}>
            <Skeleton className="h-4 w-8" style={{ gridRow: 1, gridColumn: 2 }} />
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={`w${i}`} className="h-3 w-2.5 self-center mr-1" style={{ gridRow: i + 2, gridColumn: 1 }} />
            ))}
            {Array.from({ length: 7 * WEEKS }, (_, i) => (
              <Skeleton key={i} radius="tile" className="aspect-square" style={{ gridRow: (i % 7) + 2, gridColumn: Math.floor(i / 7) + 2 }} />
            ))}
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton radius="pane" className="flex-1 @3xl:min-w-72 h-72" />
      </div>
    </div>
  )
}
