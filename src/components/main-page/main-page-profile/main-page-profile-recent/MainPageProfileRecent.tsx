import type { ReactNode } from 'react'
import { IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { SURFACE } from '@/components/ui/surface'
import { buttonClass } from '@/components/ui/Button'
import EmptyState from '@/components/empty-state/EmptyState'
import { SkeletonRow } from '@/components/ui/SkeletonList'

/** Three rows (52 px each, 48 on a fit screen): the least a filling list keeps, so the card never drops under today's three. */
const FILL = 'flex-1 h-0 min-h-[9.75rem] fit:min-h-[9rem] overflow-hidden'

/**
 * The last achievements under the profile, the same card on every platform:
 * its title, then the rows, or while they load as many shapes, an error with a
 * retry, or a quiet "none yet". With `listRef` (`useFitCount`'s) the rows take
 * whatever height the column gives the card, three at least, and its height of 0
 * keeps them from counting toward the column's own (#202).
 */
export default function MainPageProfileRecent({
  title,
  loading,
  error,
  onRetry,
  retryLabel,
  rows = 3,
  listRef,
  children,
}: {
  title: string
  /** Loading with nothing to show yet. */
  loading?: boolean
  /** What failed, said in an alert; with `onRetry`, a button to ask again. */
  error?: string | null
  onRetry?: () => void
  retryLabel?: string
  /** How many shapes stand in while loading: as many as the rows it will show. */
  rows?: number
  /** The list's box, measured by `useFitCount`: given, the list fills the card. */
  listRef?: (box: HTMLElement | null) => void
  /** The rows; nothing (or an empty array) means none yet. */
  children?: ReactNode
}) {
  const { T } = useLanguage()
  const empty = !children || (Array.isArray(children) && children.length === 0)
  const box = `flex flex-col ${listRef ? FILL : ''}`

  return (
    // Room for the three rows it can hold, loading or loaded: the profile column
    // sets the height of the home page's top row, so this box changing size as
    // it filled made the whole page jump.
    <div className={`${SURFACE} p-5 fit:p-4 flex flex-col gap-1 flex-1 min-h-[12rem]`}>
      <p className="text-[1.0625rem] font-bold mb-1.5">{title}</p>
      {loading ? (
        <div ref={listRef} aria-busy="true" className={box}>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} className="gap-3 py-1.5 fit:py-1" />
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
        <ol ref={listRef} className={box}>{children}</ol>
      )}
    </div>
  )
}
