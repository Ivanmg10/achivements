import type { ReactNode } from 'react'

/** The list's two columns (the games, the open game); the toolbar keeps them so the search is as wide as the list. */
export const LIBRARY_COLUMNS = 'lg:grid-cols-[minmax(22rem,35rem)_minmax(0,1fr)]'

/**
 * The one row of controls of a library page, in the same place in every view (#129): the search
 * first, as wide as the list under it, then the filters, and at the far end the order, the card size
 * and the views, all one height (#169). Below lg the search has its row and the rest shares the
 * next; on a phone the views are icons, so the order and they fit on one line. A view leaves out what does not apply to it; what stays never moves.
 */
export default function LibraryToolbar({ search, filters, end }: { search: ReactNode; filters?: ReactNode; end?: ReactNode }) {
  return (
    <div className={`flex flex-col gap-3 lg:grid lg:gap-x-5 lg:items-start ${LIBRARY_COLUMNS}`}>
      {search}
      {/* Each piece is a line of the toolbar's height, so a row that wraps (the filters, then the order and the views, at
          1280) keeps its first line beside the search. */}
      <div className="flex items-center gap-x-3 gap-y-2 flex-wrap min-w-0 [&>*]:min-h-(--h-control)">
        {filters}
        {end && <div className="flex items-center gap-2 flex-wrap lg:ml-auto">{end}</div>}
      </div>
    </div>
  )
}
