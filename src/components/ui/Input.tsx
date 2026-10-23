import { useId } from 'react'

type FieldShape = {
  /** Draws the field in the danger colour (an error is shown beside it). */
  invalid?: boolean
  /** Room on the left for an icon placed by the caller (or SearchInput). */
  icon?: boolean
  /** `sm` for toolbars and dense rows; `md` (52 px) for forms. */
  size?: 'sm' | 'md'
}

/**
 * The library's sunken field: darker than the card with an inner shadow,
 * lighter and ringed with the accent on hover, the card's colour with an
 * accent ring when focused, the danger colour when invalid.
 */
export function fieldClass({ invalid = false, icon = false, size = 'md' }: FieldShape = {}, className = '') {
  return (
    'w-full rounded-field bg-bg-main text-text-main placeholder:text-text-secondary outline-none ' +
    'shadow-[inset_0_2px_4px_rgb(0_0_0/0.22)] ring-1 ring-inset transition-[background-color,box-shadow] duration-(--motion-hover) ' +
    'focus-visible:bg-bg-card focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ' +
    (invalid
      ? 'ring-danger/70 hover:ring-danger focus-visible:ring-danger '
      : 'ring-ink/[0.08] hover:bg-bg-tertiary/60 hover:ring-accent/50 focus-visible:ring-accent ') +
    (size === 'sm' ? 'h-(--h-control) text-sm ' : 'h-(--h-field) text-[0.9375rem] ') +
    (icon ? 'pl-10 pr-3.5 ' : 'px-3.5 ') +
    className
  )
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'className'> &
  FieldShape & { className?: string; ref?: React.Ref<HTMLInputElement> }

/** A text-like input in the library's field style. */
export default function Input({ invalid, icon, size, className = '', ...rest }: InputProps) {
  return <input aria-invalid={invalid || undefined} className={fieldClass({ invalid, icon, size }, className)} {...rest} />
}

type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  invalid?: boolean
  className?: string
  ref?: React.Ref<HTMLTextAreaElement>
}

/** A multi-line field: the same look, its own height. */
export function Textarea({ invalid, className = '', ...rest }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={`${fieldClass({ invalid }, 'h-auto! py-3 resize-y')} ${className}`}
      {...rest}
    />
  )
}

type ControlProps = { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true }

/**
 * A field's frame: label, an optional note ("Optional", a counter), the
 * control, and the hint or the error under it, wired by id. The control is a
 * render prop so any of the library's inputs fits.
 */
export function Field({
  label,
  aside,
  hint,
  error,
  className = '',
  children,
}: {
  label: React.ReactNode
  /** Beside the label: "Optional", a counter… */
  aside?: React.ReactNode
  /** The rule the field follows; replaced by the error when there is one. */
  hint?: React.ReactNode
  error?: React.ReactNode
  /** Layout only. */
  className?: string
  children: (control: ControlProps) => React.ReactNode
}) {
  const id = useId()
  const noteId = `${id}-note`
  const note = error || hint

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-xs font-semibold text-text-secondary">{label}</label>
        {aside && <span className="text-xs text-text-secondary tabular-nums">{aside}</span>}
      </div>
      {children({ id, 'aria-describedby': note ? noteId : undefined, 'aria-invalid': error ? true : undefined })}
      {note && (
        <p id={noteId} role={error ? 'alert' : undefined} className={`text-xs ${error ? 'text-danger' : 'text-text-secondary'}`}>
          {note}
        </p>
      )}
    </div>
  )
}
