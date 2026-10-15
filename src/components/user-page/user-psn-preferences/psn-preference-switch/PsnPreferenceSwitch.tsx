'use client'

import { useId, type ReactNode } from 'react'

/**
 * One on/off preference as a row: icon chip, label, the current state written
 * out, and a switch. Saved by whoever owns `onChange`.
 */
export default function PsnPreferenceSwitch({
  icon,
  label,
  onText,
  offText,
  checked,
  onChange,
}: {
  icon: ReactNode
  label: string
  onText: string
  offText: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  const labelId = useId()
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 -mx-1 py-1.5">
      <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-xl bg-bg-card ring-1 ring-ink/[0.06] flex items-center justify-center text-text-secondary">
        {icon}
      </span>
      <span className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span id={labelId} className="text-xs text-text-secondary">{label}</span>
        <span className="text-sm font-medium">{checked ? onText : offText}</span>
      </span>
      <button
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${checked ? 'bg-accent' : 'bg-ink/20'}`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  )
}
