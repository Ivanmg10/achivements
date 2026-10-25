import type { ReactNode } from 'react'
import { SURFACE } from '@/components/ui/surface'

/** One part of the catalogue: its title, what it is for, and its pieces in a row that wraps. */
export default function DesignCatalogSection({ id, title, hint, children }: { id: string; title: string; hint: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`${SURFACE} p-5 sm:p-6 flex flex-col gap-4 scroll-mt-24`}>
      <div>
        <h2 id={`${id}-title`} className="text-lg font-extrabold">{title}</h2>
        <p className="text-[0.8125rem] text-text-secondary">{hint}</p>
      </div>
      {children}
    </section>
  )
}

/** A labelled specimen inside a section: the piece, with its name under it. */
export function Specimen({ name, children, className = '' }: { name: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <code className="text-[0.6875rem] text-text-secondary">{name}</code>
    </div>
  )
}
