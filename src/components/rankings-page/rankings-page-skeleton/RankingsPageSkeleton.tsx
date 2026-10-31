import { slantStyle } from '@/components/ui/shape'
import { Skeleton } from '@/components/ui/Skeleton'

/** A page is twenty: the three on the podium and the rest in rows. */
const PAGE = 20
const ON_PODIUM = 3
const SLANT = slantStyle(14)

/** A place on the podium, block for block: picture, name and level, points, and its step. */
function Step({ who, avatar, step }: { who: string; avatar: string; step: string }) {
  return (
    <div className="rounded-[1.125rem] bg-bg-card ring-1 ring-inset ring-ink/[0.06] pt-4 sm:pt-[1.125rem] px-2 sm:px-3.5 flex flex-col items-center gap-1.5 overflow-hidden">
      <div className={`flex flex-col items-center gap-2.5 w-full ${who}`}>
        <Skeleton radius="circle" className={`${avatar} shrink-0`} />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton radius="tag" className="h-6 w-16 max-w-full" />
      </div>
      <Skeleton className="h-[22.5px] sm:h-[37.5px] w-4/5" />
      <Skeleton radius="tag" className={`self-stretch mx-2 sm:mx-3.5 ${step}`} style={SLANT} />
    </div>
  )
}

/** The rankings while they load: the podium's three places and a page of rows, in the page's own shapes. */
export default function RankingsPageSkeleton({ podium = true }: { podium?: boolean }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-[1.125rem]">
      {podium && (
        <div aria-hidden="true" className="grid grid-cols-[1fr_1.15fr_1fr] gap-2 sm:gap-3.5 items-end">
          <Step who="h-[146px] sm:h-[126.5px]" avatar="w-16 h-16" step="h-12 sm:h-[4.375rem]" />
          <Step who="h-[166px] sm:h-[146.5px]" avatar="w-[84px] h-[84px]" step="h-[4.5rem] sm:h-[6.25rem]" />
          <Step who="h-[142px] sm:h-[122.5px]" avatar="w-[60px] h-[60px]" step="h-9 sm:h-[3.25rem]" />
        </div>
      )}
      <div aria-hidden="true" className="flex flex-col gap-1.5 md:gap-0 md:bg-bg-card md:rounded-card md:ring-1 md:ring-inset md:ring-ink/[0.06] md:overflow-hidden">
        <div className="hidden md:flex items-center h-[35.7px] px-3 shadow-[inset_0_-1px_0_rgb(var(--ink)/0.1)]">
          <Skeleton className="h-3 w-24" />
        </div>
        {Array.from({ length: podium ? PAGE - ON_PODIUM : PAGE }, (_, i) => (
          <div key={i} className="flex items-center gap-3 h-[102.7px] md:h-[69.4px] bg-bg-card md:bg-transparent rounded-tile md:rounded-none px-3 md:shadow-[inset_0_-1px_0_rgb(var(--ink)/0.05)]">
            <Skeleton className="h-6 w-7 shrink-0" />
            <Skeleton radius="circle" className="w-10 h-10 shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-32 max-w-full" />
              <Skeleton radius="tag" className="h-5 w-14" />
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-1.5 w-[7.5rem] hidden md:block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
