'use client'

import { ReactNode } from 'react'
import { IconPencil } from '@tabler/icons-react'

/**
 * One editable line of the account page: a label, the current value, and a
 * pencil that appears on hover or focus. The whole row is the button, so it
 * is reachable by keyboard and reads as "Edit <label>" to a screen reader.
 */
export default function ProfileField({
  label,
  value,
  empty,
  onEdit,
  children,
}: {
  label: string
  /** Plain text value; use `children` instead for a value with an icon. */
  value?: string | null
  /** Shown in place of a missing value. */
  empty?: string
  onEdit?: () => void
  children?: ReactNode
}) {
  const body = children ?? (
    <span className={`text-sm truncate ${value ? 'font-medium' : 'text-text-secondary italic'}`}>
      {value || empty || '—'}
    </span>
  )

  const content = (
    <>
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="flex items-center gap-2 min-w-0">
        {body}
        {onEdit && (
          <IconPencil
            size={13}
            aria-hidden="true"
            className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
          />
        )}
      </span>
    </>
  )

  if (!onEdit) return <div className="flex flex-col gap-0.5 min-w-0">{content}</div>

  return (
    <button
      onClick={onEdit}
      aria-label={`${label}: ${value || empty || '—'}`}
      className="group flex flex-col gap-0.5 min-w-0 text-left rounded-lg px-1 -mx-1 py-0.5 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      {content}
    </button>
  )
}
