import type { ReactNode } from 'react'

/** The empty place that adds another item to a collection: a dashed border and nothing else (no stripes, #130). */
export default function DropSlot({
  label,
  onClick,
  className = '',
  children,
}: {
  label: string
  onClick: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`w-full h-full flex items-center justify-center gap-2 rounded-card text-text-main border-2 border-dashed border-accent/35 hover:border-accent transition-colors cursor-pointer focus-ring ${className}`}
    >
      {children}
    </button>
  )
}
