import type { ReactNode } from 'react'
import SectionHead from './SectionHead'

/** A titled group of cards, with an optional action to see the whole group. */
export default function Shelf({
  title,
  hint,
  action,
  children,
}: {
  title: string
  hint?: string
  action?: { label: string; onClick: () => void }
  children: ReactNode
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <SectionHead
        title={title}
        hint={hint}
        className="enter-rise"
        aside={
          action && (
            <button type="button" onClick={action.onClick} className="hover:text-text-main underline underline-offset-4 rounded focus-ring">
              {action.label}
            </button>
          )
        }
      />
      {children}
    </section>
  )
}
