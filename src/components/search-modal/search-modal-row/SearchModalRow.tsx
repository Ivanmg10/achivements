import type { ReactNode } from 'react'
import { matchParts } from '@/utils/utils'

/**
 * A row of the search panel's look, for a button that is not a `SearchModalRow`
 * (a person, drawn by `UserSummary`): the accent tint on hover and focus, and
 * the accent's slanted mark on the left of the one with focus.
 */
export const SEARCH_ROW =
  "relative overflow-hidden w-full flex items-center gap-3 min-h-[3.375rem] px-2.5 py-1.5 rounded-tile text-left cursor-pointer transition-colors hover:bg-accent/10 focus-visible:bg-accent/10 focus-visible:outline-none before:content-[''] before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-[3px] before:bg-accent before:skew-y-(--slant-mark) before:opacity-0 focus-visible:before:opacity-100"

/**
 * One result in the search panel: a picture, the name with what matches the
 * search drawn in the accent, a line under it and something on the right.
 * Arrow keys move between rows (`data-search-option`).
 */
export default function SearchModalRow({
  media,
  title,
  query = '',
  sub,
  right,
  onSelect,
}: {
  media: ReactNode
  title: string
  /** What was typed, drawn apart where the title matches it. */
  query?: string
  sub?: ReactNode
  right?: ReactNode
  onSelect: () => void
}) {
  return (
    <button type="button" data-search-option onClick={onSelect} className={SEARCH_ROW}>
      <span className="w-10 h-10 rounded-box overflow-hidden shrink-0 flex items-center justify-center bg-ink/10">{media}</span>
      <span className="flex-1 min-w-0">
        {/* The title whole for a screen reader; drawn in parts, where it matches, for the eye. */}
        <span className="sr-only">{title}</span>
        <span aria-hidden="true" className="block font-bold truncate">
          {matchParts(title, query).map((p, i) =>
            p.match ? (
              <mark key={i} className="bg-transparent text-accent font-extrabold">
                {p.text}
              </mark>
            ) : (
              <span key={i}>{p.text}</span>
            ),
          )}
        </span>
        {sub && <span className="block text-[0.8125rem] text-text-secondary truncate">{sub}</span>}
      </span>
      {right}
    </button>
  )
}
