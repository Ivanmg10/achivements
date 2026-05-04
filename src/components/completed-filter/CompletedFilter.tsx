'use client'

export type CompletedMode = 'all' | 'softcore' | 'hardcore'

const TABS: { label: string; value: CompletedMode }[] = [
  { label: 'All',      value: 'all' },
  { label: 'Softcore', value: 'softcore' },
  { label: 'Hardcore', value: 'hardcore' },
]

export default function CompletedFilter({
  value,
  onChange,
}: {
  value: CompletedMode
  onChange: (v: CompletedMode) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {TABS.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`text-sm px-3 py-1 rounded-lg transition-colors cursor-pointer ${
            value === t.value
              ? 'bg-accent text-bg-main font-medium'
              : 'bg-bg-card text-text-secondary hover:text-text-main'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
