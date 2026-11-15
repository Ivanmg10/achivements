import type { ReactNode } from 'react'

/**
 * The one row of controls of a library page, in the same place in its three views (#129): the search
 * first, then the filters, and at the far end the order, the card size and the views. A view leaves
 * out what does not apply to it (the shelves have no filter or order); what stays never moves.
 */
export default function LibraryToolbar({ search, filters, end }: { search: ReactNode; filters?: ReactNode; end?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {search}
      {filters}
      <span className="hidden sm:block grow" aria-hidden="true" />
      {end && <div className="flex items-center gap-2 flex-wrap">{end}</div>}
    </div>
  )
}
