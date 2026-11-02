import type { ReactNode } from 'react'

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
      <div className="flex items-baseline gap-x-3 gap-y-0.5 flex-wrap enter-rise">
        <h2 className="text-base font-bold">{title}</h2>
        {hint && <p className="text-xs text-text-secondary">{hint}</p>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="ml-auto text-xs text-text-secondary hover:text-text-main underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {action.label}
          </button>
        )}
      </div>
      {children}
    </section>
  )
}
