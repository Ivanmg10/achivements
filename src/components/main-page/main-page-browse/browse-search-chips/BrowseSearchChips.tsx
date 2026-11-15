'use client'

import { pillClass } from '@/components/ui/Pill'

/** A row of toggle chips; the pressed one is bold and filled, not only coloured. */
export default function BrowseSearchChips<V extends string>({ label, value, options, onChange }: { label: string; value: V; options: { value: V; label: string }[]; onChange: (v: V) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={pillClass(o.value === value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
