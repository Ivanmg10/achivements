import { useId } from 'react'

/**
 * The look of one choice card, for a group that cannot use ChoiceCards itself
 * (one that saves and closes on the first pick, where an arrow key must not choose).
 * Chosen: ringed and tinted with the accent, never by colour alone.
 */
export function choiceClass(selected: boolean, className = '') {
  return (
    'relative flex items-start gap-2.5 p-3 rounded-control text-left cursor-pointer ring-1 transition-colors duration-(--motion-hover) ' +
    'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50 ' +
    (selected ? 'ring-2 ring-accent bg-accent/10 ' : 'ring-ink/10 bg-bg-main hover:ring-accent/50 ') +
    className
  )
}

export type Choice<V> = {
  value: V
  label: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  /** A small drawing of the choice, above its words (decorative: the words say it). */
  preview?: React.ReactNode
}

/**
 * A choice among a few options shown as cards (who sees a group, a theme…):
 * native radios underneath, so arrows move between them as in any radio group.
 */
export default function ChoiceCards<V>({
  legend,
  value,
  onChange,
  options,
  columns = 2,
  className = '',
}: {
  legend: React.ReactNode
  value: V
  onChange: (value: V) => void
  options: Choice<V>[]
  columns?: 2 | 3 | 4
  className?: string
}) {
  const name = useId()
  const grid = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }[columns]

  return (
    <fieldset className={`flex flex-col gap-2 ${className}`}>
      <legend className="text-xs font-semibold text-text-secondary mb-2">{legend}</legend>
      <div className={`grid ${grid} gap-2`}>
        {options.map((o, i) => {
          const checked = o.value === value
          const Icon = o.icon
          return (
            <label key={i} className={choiceClass(checked, o.preview ? 'flex-col items-stretch! gap-3' : '')}>
              <input type="radio" name={name} checked={checked} onChange={() => onChange(o.value)} className="sr-only" />
              {o.preview && <span aria-hidden="true">{o.preview}</span>}
              {Icon && <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${checked ? 'text-accent' : 'text-text-secondary'}`} aria-hidden="true" />}
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-text-main">{o.label}</span>
                {o.hint && <span className="text-[11px] text-text-secondary leading-snug">{o.hint}</span>}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
