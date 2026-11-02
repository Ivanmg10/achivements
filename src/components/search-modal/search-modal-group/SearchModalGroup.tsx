import type { ReactNode } from 'react'

/** A group of the search panel: a small title (and, beside it, an action such as "clear"), then its rows. */
export default function SearchModalGroup({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="px-2.5 pt-3 pb-1.5">
      <div className="flex items-center justify-between mx-2 mb-1.5">
        <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-text-secondary">{title}</p>
        {aside}
      </div>
      {children}
    </section>
  )
}
