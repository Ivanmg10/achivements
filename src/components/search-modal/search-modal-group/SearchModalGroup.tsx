import type { ReactNode } from 'react'
import Kicker from '@/components/ui/Kicker'

/** A group of the search panel: a small title (and, beside it, an action such as "clear"), then its rows. */
export default function SearchModalGroup({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="px-2.5 pt-3 pb-1.5">
      <div className="flex items-center justify-between mx-2 mb-1.5">
        <Kicker size="sm">{title}</Kicker>
        {aside}
      </div>
      {children}
    </section>
  )
}
