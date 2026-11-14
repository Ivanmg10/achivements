import type { ReactNode } from 'react'
import Kicker from '@/components/ui/Kicker'
import Facts from '@/components/ui/Facts'

/** A group of the search panel: a small title with how many it holds when it says so (joined by the site's mark), and, beside it, an action such as "clear"; then its rows. */
export default function SearchModalGroup({ title, count, aside, children }: { title: string; count?: number; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={count === undefined ? title : `${title}, ${count}`} className="px-2.5 pt-3 pb-1.5">
      <div className="flex items-center justify-between mx-2 mb-1.5">
        <Kicker size="sm"><Facts items={[title, count]} /></Kicker>
        {aside}
      </div>
      {children}
    </section>
  )
}
