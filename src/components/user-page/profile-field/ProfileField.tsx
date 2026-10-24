'use client'

import { ReactNode } from 'react'
import { IconPencil } from '@tabler/icons-react'

/**
 * One editable line of the account page: a label, the current value, and a
 * pencil that appears on hover or focus (and stays, faint, on touch screens,
 * where there is no hover to reveal it). The whole row is the button, so it
 * is reachable by keyboard and reads as "Edit <label>" to a screen reader.
 * An optional `icon` sits in a chip before the label.
 */
export default function ProfileField({
  label,
  value,
  empty,
  onEdit,
  icon,
  children,
  sunken,
}: {
  label: string
  /** Plain text value; use `children` instead for a value with an icon. */
  value?: string | null
  /** Shown in place of a missing value. */
  empty?: string
  onEdit?: () => void
  /** Decorative icon in a chip before the label. */
  icon?: ReactNode
  children?: ReactNode
  /** Drawn as a sunken field, as the account's own details are. */
  sunken?: boolean
}) {
  const body = children ?? (
    <span className={`text-sm truncate ${value ? 'font-medium' : 'text-text-secondary italic'}`}>
      {value || empty || '—'}
    </span>
  )

  const text = (
    <>
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="flex items-center gap-2 min-w-0">
        {body}
        {onEdit && (
          <IconPencil
            size={13}
            aria-hidden="true"
            className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-60 transition-opacity"
          />
        )}
      </span>
    </>
  )

  const content = icon ? (
    <span className="flex items-center gap-3 min-w-0">
      <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-xl bg-bg-card ring-1 ring-ink/[0.06] flex items-center justify-center text-text-secondary">
        {icon}
      </span>
      <span className="flex flex-col gap-0.5 min-w-0">{text}</span>
    </span>
  ) : (
    text
  )

  if (!onEdit) return <div className="flex flex-col gap-0.5 min-w-0">{content}</div>

  return (
    <button
      onClick={onEdit}
      aria-label={`${label}: ${value || empty || '—'}`}
      className={`group flex flex-col gap-0.5 min-w-0 text-left transition-[background-color,box-shadow] duration-(--motion-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
        sunken
          ? 'rounded-field bg-bg-main px-3.5 py-2.5 shadow-[inset_0_2px_4px_rgb(0_0_0/0.22)] ring-1 ring-inset ring-ink/[0.08] hover:ring-accent/50'
          : 'rounded-xl px-2 -mx-1 py-1.5 hover:bg-ink/5'
      }`}
    >
      {content}
    </button>
  )
}
