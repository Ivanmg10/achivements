'use client'

import type { ReactNode } from 'react'
import { IconCheck } from '@tabler/icons-react'

type Option = { value: boolean; label: string }

/**
 * One two-way preference as a card: an icon chip and title, then the options
 * stacked on a phone and side by side from sm. The chosen one is filled and
 * carries a check, so the choice is not told by colour alone.
 */
export default function PsnPreferenceChoice({
  icon,
  title,
  current,
  options,
  onChoose,
}: {
  icon: ReactNode
  title: string
  current: boolean
  options: Option[]
  onChoose: (value: boolean) => void
}) {
  return (
    <section className="bg-bg-main rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-xl bg-bg-card ring-1 ring-ink/[0.06] flex items-center justify-center text-text-secondary">
          {icon}
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div role="radiogroup" aria-label={title} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((o) => {
          const selected = current === o.value
          return (
            <button
              key={String(o.value)}
              role="radio"
              aria-checked={selected}
              onClick={() => onChoose(o.value)}
              className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm text-left font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                selected ? 'bg-accent text-bg-main' : 'bg-bg-card hover:bg-bg-card/70 text-text-main'
              }`}
            >
              {o.label}
              <IconCheck size={16} aria-hidden="true" className={selected ? '' : 'invisible'} />
            </button>
          )
        })}
      </div>
    </section>
  )
}
