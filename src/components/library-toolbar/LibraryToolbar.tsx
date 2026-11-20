import type { ReactNode } from 'react'

/** The list's two columns (the games, the open game); the toolbar keeps them so the search is as wide as the list. */
export const LIBRARY_COLUMNS = 'lg:grid-cols-[minmax(22rem,35rem)_minmax(0,1fr)]'

/**
 * The one row of controls of a library page, in the same place in every view (#129): the search
 * first, as wide as the list under it, then the filters, and at the far end the order, the card size
 * and the views, all one height (#169). Below lg the search has its row and the rest shares the
 * next. A view leaves out what does not apply to it; what stays never moves.
 */
export default function LibraryToolbar({ search, filters, end }: { search: ReactNode; filters?: ReactNode; end?: ReactNode }) {
  return (
    <div className={`flex flex-col gap-3 lg:grid lg:gap-5 lg:items-center ${LIBRARY_COLUMNS}`}>
      {search}
      <div className="flex items-center gap-3 flex-wrap min-w-0">
        {filters}
        {end && <div className="flex items-center gap-2 flex-wrap lg:ml-auto">{end}</div>}
      </div>
    </div>
  )
}
