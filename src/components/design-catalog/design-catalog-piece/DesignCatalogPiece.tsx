import type { ReactNode } from 'react'
import { SURFACE } from '@/components/ui/surface'
import { pieceById } from '../catalogue'

/**
 * One piece of the design system as a card: its name and where it lives, what
 * it is for, what is shown (its specimens), then its props and the rules that
 * must hold. The card's text comes from the registry (`catalogue.ts`), the same
 * list the menu reads, so the two cannot disagree.
 */
export default function DesignCatalogPiece({ id, children }: { id: string; children?: ReactNode }) {
  const piece = pieceById(id)
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`${SURFACE} p-5 sm:p-7 flex flex-col gap-5 scroll-mt-24`}>
      <header className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 id={`${id}-title`} className="text-2xl font-extrabold tracking-tight">{piece.title}</h3>
          <code className="text-xs text-text-secondary">{piece.source}</code>
        </div>
        <p className="max-w-3xl text-[0.9375rem] text-text-secondary leading-relaxed">{piece.summary}</p>
      </header>

      {children}

      {(piece.props || piece.rules) && (
        <footer className="grid gap-5 lg:grid-cols-2 pt-4 shadow-[inset_0_1px_0_rgb(var(--ink)/0.08)]">
          {piece.props && (
            <dl className="flex flex-col gap-2">
              <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-text-secondary">Props and options</dt>
              {piece.props.map(([name, what]) => (
                <dd key={name} className="text-[0.8125rem] leading-snug">
                  <code className="text-accent">{name}</code> <span className="text-text-secondary">{what}</span>
                </dd>
              ))}
            </dl>
          )}
          {piece.rules && (
            <div className="flex flex-col gap-2">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-text-secondary">Rules</p>
              <ul className="flex flex-col gap-1.5">
                {piece.rules.map((rule) => (
                  <li
                    key={rule}
                    className="relative pl-4 text-[0.8125rem] text-text-secondary leading-snug before:content-[''] before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-[3px] before:bg-accent before:skew-y-(--slant-mark)"
                  >
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </footer>
      )}
    </section>
  )
}

/** A named specimen: the piece, with what it is called under it. */
export function Specimen({ name, children, className = '' }: { name?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <div className="flex flex-wrap items-center gap-2.5">{children}</div>
      {name && <code className="text-[0.6875rem] text-text-secondary">{name}</code>}
    </div>
  )
}

const DESIGNS = [
  { shape: 'slanted', label: 'Slanted', note: 'the default' },
  { shape: 'round', label: 'Round', note: 'the classic look' },
] as const

/**
 * The same specimens in both designs, side by side, each inside its own scope
 * (`data-shape`), whichever design the page is in. Every instance is its own
 * (separate state), so a switch flips in one column only.
 */
export function Compare({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {DESIGNS.map(({ shape, label, note }) => (
        <div key={shape} data-shape={shape} role="group" aria-label={label} className="rounded-pane bg-bg-main/60 ring-1 ring-inset ring-ink/[0.06] p-4 sm:p-5 flex flex-col gap-4">
          <p className="flex items-baseline gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-text-secondary">
            {label} <span className="font-normal normal-case tracking-normal">· {note}</span>
          </p>
          {children}
        </div>
      ))}
    </div>
  )
}

/** One panel for a specimen that does not change with the design. */
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-pane bg-bg-main/60 ring-1 ring-inset ring-ink/[0.06] p-4 sm:p-5 flex flex-col gap-4 ${className}`}>{children}</div>
}
