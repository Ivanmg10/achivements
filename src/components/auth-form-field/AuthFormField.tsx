'use client'

import { ReactNode, useId } from 'react'

/**
 * One field of the sign-in and register forms: icon, label, input, and the
 * rule or error that belongs to it.
 *
 * The label is visible rather than only a placeholder, so the field still
 * says what it is once there is something typed in it. A field that fails
 * validation names the problem underneath and points at it with
 * `aria-describedby`, so it is announced too.
 */
export default function AuthFormField({
  label,
  icon,
  hint,
  error,
  value,
  onChange,
  ...input
}: {
  label: string
  icon: ReactNode
  /** The rule this field follows, shown while it is still valid. */
  hint?: string
  /** What is wrong with what was typed. Replaces the hint. */
  error?: string
  value: string
  onChange: (value: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const id = useId()
  const noteId = `${id}-note`
  const note = error ?? hint

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
          {icon}
        </span>
        <input
          {...input}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          className={`bg-bg-tertiary text-text-main rounded-xl pl-10 pr-3 py-3 w-full outline-none placeholder:text-text-secondary focus-visible:ring-2 transition-shadow ${
            error ? 'ring-1 ring-danger focus-visible:ring-danger' : 'focus-visible:ring-accent'
          }`}
        />
      </div>
      {note && (
        <p id={noteId} className={`text-xs ${error ? 'text-danger' : 'text-text-secondary/70'}`}>
          {note}
        </p>
      )}
    </div>
  )
}
