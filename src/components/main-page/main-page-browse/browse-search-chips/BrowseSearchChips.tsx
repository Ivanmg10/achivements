'use client'

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
          className={`px-2.5 py-1 rounded-full text-[11px] ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
            o.value === value ? 'bg-bg-tertiary ring-ink/15 text-text-main font-semibold' : 'ring-ink/[0.06] text-text-secondary hover:text-text-main'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
