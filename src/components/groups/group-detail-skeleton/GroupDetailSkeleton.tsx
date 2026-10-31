import { useLanguage } from '@/context/LanguageContext'
import { Skeleton } from '@/components/ui/Skeleton'

/** A group's page while it loads, in the page's own shape: banner, bar, covers. Announced once. */
export default function GroupDetailSkeleton() {
  const { T } = useLanguage()
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">{T.loadingPage.title}</span>
      <div aria-hidden="true" className="flex flex-col gap-5">
        <Skeleton radius="card" className="h-64 -mx-4 sm:mx-0" />
        <Skeleton radius="card" className="h-13" />
        <div className="grid gap-x-4 gap-y-6 grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(7.5rem,9rem))]">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton radius="card" className="aspect-square" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-1.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
