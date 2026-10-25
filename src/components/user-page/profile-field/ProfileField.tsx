'use client'

import { ReactNode } from 'react'
import { IconChevronRight, IconPencil } from '@tabler/icons-react'

/**
 * One editable line of the account page: a label, the current value, and a
 * pencil that appears on hover or focus (and stays, faint, on touch screens,
 * where there is no hover to reveal it). The whole row is the button, so it
 * is reachable by keyboard and reads as "Edit <label>" to a screen reader.
 * An optional `icon` sits before the label, and the row ends in a chevron:
 * it opens a picker. `sunken`: the account's own fields, label above the field.
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
    <span className={`truncate ${sunken ? 'text-[0.9375rem]' : 'text-[0.9375rem] font-bold'} ${value ? '' : 'text-text-secondary italic font-normal!'}`}>
      {value || empty || '—'}
    </span>
  )

  const text = (
    <>
      {!sunken && <span className="text-[0.8125rem] text-text-secondary">{label}</span>}
      <span className="flex items-center gap-2 min-w-0">
        {body}
        {onEdit && !icon && (
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
    <span className="flex items-center gap-3.5 min-w-0">
      <span aria-hidden="true" className="w-9 h-9 shrink-0 flex items-center justify-center text-text-secondary">
        {icon}
      </span>
      <span className="flex flex-col min-w-0 flex-1">{text}</span>
      {onEdit && <IconChevronRight size={16} aria-hidden="true" className="shrink-0 text-text-secondary group-hover:text-text-main transition-colors" />}
    </span>
  ) : (
    text
  )

  if (!onEdit) return <div className="flex flex-col gap-0.5 min-w-0">{content}</div>

  const button = (
    <button
      onClick={onEdit}
      aria-label={`${label}: ${value || empty || '—'}`}
      className={`group flex flex-col gap-0.5 min-w-0 text-left transition-[background-color,box-shadow] duration-(--motion-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
        sunken
          ? 'rounded-field bg-bg-main px-3.5 py-2.5 shadow-[inset_0_2px_4px_rgb(0_0_0/0.22)] ring-1 ring-inset ring-ink/[0.08] hover:ring-accent/50'
          : 'rounded-xl px-1 -mx-1 py-1.5 hover:bg-ink/5'
      }`}
    >
      {content}
    </button>
  )
  // A field of the account's own: its label above it, as a form's.
  return sunken ? (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span aria-hidden="true" className="text-[0.8125rem] font-semibold text-text-secondary">{label}</span>
      {button}
    </div>
  ) : (
    button
  )
}
