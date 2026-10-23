import { IconCheck } from '@tabler/icons-react'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'className' | 'children'> & {
  checked: boolean
  onChange: (next: boolean) => void
  /** The visible label; the whole row toggles. */
  children: React.ReactNode
  /** Layout only, on the row. */
  className?: string
}

/**
 * A tick with its label: a native checkbox drawn in the library's style (the
 * accent filled when on, a small bounce on the check), so keyboard and forms
 * work as usual.
 */
export default function Checkbox({ checked, onChange, children, className = '', disabled, ...input }: Props) {
  return (
    <label className={`flex items-center gap-2.5 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <span className="relative grid place-items-center shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer appearance-none w-[1.125rem] h-[1.125rem] rounded-[5px] bg-bg-main ring-1 ring-inset ring-ink/25 shadow-[inset_0_1px_2px_rgb(0_0_0/0.25)] transition-colors duration-(--motion-hover) checked:bg-accent checked:ring-accent hover:ring-accent/60 cursor-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          {...input}
        />
        <IconCheck
          size={13}
          stroke={3}
          aria-hidden="true"
          className="absolute pointer-events-none text-bg-main scale-0 peer-checked:scale-100 transition-transform duration-(--motion-open) ease-(--ease-spring) motion-reduce:transition-none"
        />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  )
}
