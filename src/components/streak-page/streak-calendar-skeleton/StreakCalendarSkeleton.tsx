import { Skeleton } from '@/components/ui/Skeleton'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { CALENDAR_GRID, CALENDAR_WIDE, calendarColumns, calendarWeeks } from '../streak-calendar/StreakCalendar'

/** "The streak, day by day" while the year loads, in the calendar's own shape: the weeks' buttons, the months, the weekdays, its window of weeks, the legend and the picked day's panel. */
export default function StreakCalendarSkeleton() {
  const wide = useMediaQuery(CALENDAR_WIDE)
  const weeks = calendarWeeks(wide)
  return (
    <div aria-hidden="true" className="@container">
      <div className="flex flex-col @3xl:flex-row gap-6 @3xl:gap-10">
        <div className="flex flex-col gap-2 min-w-0 max-w-full">
          <Skeleton radius="button" className="h-8 w-56" />
          <div className={CALENDAR_GRID} style={calendarColumns(weeks, wide)}>
            <Skeleton className="h-4 w-8" style={{ gridRow: 1, gridColumn: 2 }} />
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={`w${i}`} className="h-3 w-2.5 self-center mr-1" style={{ gridRow: i + 2, gridColumn: 1 }} />
            ))}
            {Array.from({ length: 7 * weeks }, (_, i) => (
              <Skeleton key={i} radius="tile" className="aspect-square" style={{ gridRow: (i % 7) + 2, gridColumn: Math.floor(i / 7) + 2 }} />
            ))}
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton radius="pane" className="flex-1 @3xl:min-w-72 self-stretch h-[24.25rem] @3xl:h-auto" />
      </div>
    </div>
  )
}
