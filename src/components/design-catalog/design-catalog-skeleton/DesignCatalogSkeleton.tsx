import { SURFACE } from '@/components/ui/surface'
import { Skeleton } from '@/components/ui/Skeleton'

const PIECES = 3

/** The catalogue while the admin check runs: its hero, the menu on the left and the first pieces. Admin page, in English. */
export default function DesignCatalogSkeleton() {
  return (
    <main role="status" aria-busy="true" className="px-3 sm:px-8 py-6 w-full mx-auto max-w-[96rem] flex flex-col gap-6">
      <span className="sr-only">Loading the design system</span>
      <div aria-hidden="true" className="rounded-card bg-bg-card ring-1 ring-inset ring-ink/[0.06] p-6 sm:p-10 flex flex-col gap-5">
        <Skeleton className="h-4 w-56 max-w-full" />
        <Skeleton radius="tile" className="h-12 sm:h-20 w-3/5" />
        <Skeleton className="h-6 w-full max-w-3xl" />
      </div>
      <div aria-hidden="true" className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="hidden lg:flex flex-col gap-2 px-3">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-4/5" />
          ))}
        </div>
        <div className="flex flex-col gap-10 min-w-0">
          {Array.from({ length: PIECES }, (_, i) => (
            <div key={i} className={`${SURFACE} p-5 sm:p-7 flex flex-col gap-5`}>
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-full max-w-3xl" />
              <Skeleton radius="pane" className="h-40" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
