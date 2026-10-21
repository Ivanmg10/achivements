import { useLanguage } from '@/context/LanguageContext'

/** A group's page while it loads, in the page's own shape: banner, bar, covers. Announced once. */
export default function GroupDetailSkeleton() {
  const { T } = useLanguage()
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">{T.loadingPage.title}</span>
      <div aria-hidden="true" className="flex flex-col gap-5 animate-pulse motion-reduce:animate-none">
        <div className="h-64 sm:rounded-3xl bg-ink/10 -mx-4 sm:mx-0" />
        <div className="h-13 rounded-2xl bg-ink/10" />
        <div className="grid gap-x-4 gap-y-6 grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(9rem,11rem))]">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-square rounded-2xl bg-ink/10" />
              <div className="h-3 w-3/4 rounded bg-ink/10" />
              <div className="h-1.5 rounded-full bg-ink/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
