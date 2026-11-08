import type { ReactNode } from 'react'
import { matchParts } from '@/utils/utils'
import ListRow from '@/components/ui/ListRow'

/**
 * One result in the search panel: a `ListRow` whose name draws what matches
 * the search in the accent. Arrow keys move between rows (`data-search-option`).
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
    <ListRow
      data-search-option
      onClick={onSelect}
      media={media}
      sub={sub}
      trailing={right}
      title={
        <>
          {/* The title whole for a screen reader; drawn in parts, where it matches, for the eye. */}
          <span className="sr-only">{title}</span>
          <span aria-hidden="true">
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
        </>
      }
    />
  )
}
