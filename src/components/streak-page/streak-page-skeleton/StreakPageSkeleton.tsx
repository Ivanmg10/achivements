import { useLanguage } from '@/context/LanguageContext'
import { Skeleton } from '@/components/ui/Skeleton'

const BARS = [100, 46, 40, 34, 29, 26, 20, 20, 20, 14]
const CARD = 'bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06] p-5 flex flex-col gap-4'

/** The streak page while a year of unlocks loads, block for block: the banner, the chart and the days, the year and the weekdays. Announced once. */
export default function StreakPageSkeleton() {
  const { T } = useLanguage()
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">{T.loadingPage.title}</span>

      <div aria-hidden="true" className="rounded-card ring-1 ring-inset ring-ink/[0.06] bg-bg-card p-6 sm:p-[2.375rem] flex flex-col lg:flex-row lg:items-center gap-8 min-h-[440px] lg:min-h-[289px]">
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton radius="tile" className="h-14 sm:h-[5.875rem] w-3/5" />
          <Skeleton className="h-5 w-4/5 max-w-md" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 lg:w-[22rem] shrink-0">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} radius="tile" className="h-[6.25rem]" />
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="grid gap-4 xl:grid-cols-2">
        <div className={`${CARD} min-h-[428px] xl:min-h-[409px]`}>
          <Skeleton className="h-5 w-40" />
          <div className="flex items-end gap-2 flex-1 min-h-64">
            {BARS.map((h, i) => (
              <Skeleton key={i} radius="tag" className="flex-1" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className={`${CARD} min-h-[481px] xl:min-h-[409px]`}>
          <Skeleton className="h-5 w-48" />
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 21 }).map((_, i) => (
              <Skeleton key={i} radius="tile" className="h-14" />
            ))}
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="grid gap-4 xl:grid-cols-2">
        <div className={`${CARD} min-h-[218px] xl:min-h-[258px]`}>
          <Skeleton className="h-5 w-40" />
          <Skeleton radius="tag" className="flex-1" />
        </div>
        <div className={`${CARD} min-h-[253px] xl:min-h-[258px]`}>
          <Skeleton className="h-5 w-32" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-3" style={{ width: `${90 - i * 15}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
