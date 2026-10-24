import type { ReactNode } from 'react'
import { IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { SURFACE } from '@/components/ui/surface'
import { buttonClass } from '@/components/ui/Button'
import EmptyState from '@/components/empty-state/EmptyState'

/**
 * The last achievements under the profile, the same card on every platform:
 * its title, then the rows, or while they load three shapes, an error with a
 * retry, or a quiet "none yet".
 */
export default function MainPageProfileRecent({
  title,
  loading,
  error,
  onRetry,
  retryLabel,
  children,
}: {
  title: string
  /** Loading with nothing to show yet. */
  loading?: boolean
  /** What failed, said in an alert; with `onRetry`, a button to ask again. */
  error?: string | null
  onRetry?: () => void
  retryLabel?: string
  /** The rows; nothing (or an empty array) means none yet. */
  children?: ReactNode
}) {
  const { T } = useLanguage()
  const empty = !children || (Array.isArray(children) && children.length === 0)

  return (
    // Room for the three rows it can hold, loading or loaded: the profile column
    // sets the height of the home page's top row, so this box changing size as
    // it filled made the whole page jump.
    <div className={`${SURFACE} p-5 flex flex-col gap-1 flex-1 min-h-[12rem]`}>
      <p className="text-[1.0625rem] font-bold mb-1.5">{title}</p>
      {loading ? (
        <div aria-busy="true" className="flex flex-col gap-1 animate-pulse motion-reduce:animate-none">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center py-1.5">
              <div className="w-10 h-10 rounded-lg bg-ink/10 shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="h-2.5 bg-ink/10 rounded w-3/4" />
                <div className="h-2 bg-ink/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-2 flex-1 justify-center">
          <p role="alert" className="text-sm text-danger">{error}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className={buttonClass('secondary', 'sm')}>
              {retryLabel}
            </button>
          )}
        </div>
      ) : empty ? (
        <EmptyState icon={<IconTrophy className="w-6 h-6" />} title={T.cards.noEarned} size="compact" className="flex-1" />
      ) : (
        <ol className="flex flex-col">{children}</ol>
      )}
    </div>
  )
}
