import { useLanguage } from '@/context/LanguageContext'

const BARS = [100, 46, 40, 34, 29, 26, 20, 20, 20, 14]

/** The streak page while a year of unlocks loads, in the page's own shape. Announced once. */
export default function StreakPageSkeleton() {
  const { T } = useLanguage()
  return (
    <div role="status" aria-busy="true" className="grid gap-5 xl:grid-cols-2">
      <span className="sr-only">{T.loadingPage.title}</span>
      <div aria-hidden="true" className="flex flex-col gap-5 animate-pulse motion-reduce:animate-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="bg-bg-card rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-ink/10 shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-2.5 w-24 rounded bg-ink/10" />
                <div className="h-6 w-20 rounded bg-ink/10" />
                <div className="h-2.5 w-32 rounded bg-ink/10" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-bg-card rounded-2xl p-5 flex items-end gap-2 h-64">
          {BARS.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-lg bg-ink/10" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="bg-bg-card rounded-2xl p-5 grid grid-cols-7 gap-1.5 content-start animate-pulse motion-reduce:animate-none">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-ink/10" />
        ))}
      </div>
    </div>
  )
}
