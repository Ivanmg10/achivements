import type { ReactNode } from 'react'

/** The striped, empty place that adds another item to a collection. */
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
      className={`w-full h-full flex items-center justify-center gap-2 rounded-card text-text-main ring-[1.5px] ring-inset ring-accent/35 hover:ring-accent bg-[repeating-linear-gradient(-60deg,rgb(var(--accent)/0.05)_0_10px,transparent_10px_20px)] transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${className}`}
    >
      {children}
    </button>
  )
}
