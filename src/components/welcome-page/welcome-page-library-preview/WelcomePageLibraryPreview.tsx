import { useLanguage } from '@/context/LanguageContext'
import { ProgressBar } from '@/components/ui/ProgressBar'
import styles from '@/components/welcome-page/WelcomePage.module.css'

const ROWS = [
  { name: '62%', progress: 72 },
  { name: '48%', progress: 100 },
  { name: '70%', progress: 35 },
]

/**
 * Three made-up rows, shaped like the library's, in a platform's colours:
 * what the person gets by linking it. Drawn, not real games, and said so.
 */
export default function WelcomePageLibraryPreview({ art }: { art: string }) {
  const { T } = useLanguage()

  return (
    <>
      <span className={`${styles.in} text-xs font-bold uppercase tracking-[0.12em] text-text-secondary`}>{T.welcome.library.title}</span>
      <div aria-hidden="true" className="flex flex-col gap-2.5">
        {ROWS.map((row, i) => (
          <div
            key={i}
            className={`${styles.card} flex items-center gap-3.5 p-3 rounded-card bg-bg-card ring-1 ring-ink/[0.06]`}
            style={{ animationDelay: `calc(var(--enter-delay, 0s) + ${260 + i * 90}ms)` }}
          >
            <span className="w-14 h-14 shrink-0 rounded-xl" style={{ background: art }} />
            <span className="flex-1 flex flex-col gap-2">
              <span className="h-2.5 rounded-full bg-ink/15" style={{ width: row.name }} />
              <ProgressBar pct={row.progress} label={T.welcome.library.note} />
            </span>
            <span className={`w-10 text-right text-[0.8125rem] font-semibold ${row.progress === 100 ? 'text-success' : 'text-text-secondary'}`}>{row.progress}%</span>
          </div>
        ))}
      </div>
      <span className="text-xs text-text-secondary">{T.welcome.library.note}</span>
    </>
  )
}
