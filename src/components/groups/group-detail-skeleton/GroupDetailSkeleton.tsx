import { useLanguage } from '@/context/LanguageContext'

/** A group's page while it loads, in the page's own shape. Announced once. */
export default function GroupDetailSkeleton() {
  const { T } = useLanguage()
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">{T.loadingPage.title}</span>
      <div aria-hidden="true" className="flex flex-col gap-4 animate-pulse motion-reduce:animate-none">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-ink/10 shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-6 w-48 rounded bg-ink/10" />
            <div className="h-3 w-32 rounded bg-ink/10" />
            <div className="h-1.5 w-full max-w-md rounded-full bg-ink/10" />
          </div>
        </div>
        <div className="flex gap-1.5">
          {[16, 20, 24, 20].map((w, i) => (
            <div key={i} className="h-6 rounded-full bg-ink/10" style={{ width: `${w * 0.25}rem` }} />
          ))}
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-ink/10" />
        ))}
      </div>
    </div>
  )
}
