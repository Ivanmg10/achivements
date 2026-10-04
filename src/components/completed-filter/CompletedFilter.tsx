'use client'

import { useLanguage } from '@/context/LanguageContext'

export type CompletedMode = 'all' | 'softcore' | 'hardcore'

const MODES: CompletedMode[] = ['all', 'softcore', 'hardcore']

export default function CompletedFilter({
  value,
  onChange,
}: {
  value: CompletedMode
  onChange: (v: CompletedMode) => void
}) {
  const { T } = useLanguage()
  const LABELS: Record<CompletedMode, string> = {
    all: T.gameInfoTable.filterAll,
    softcore: T.categoryPage.softcore,
    hardcore: T.categoryPage.hardcore,
  }

  return (
    <div role="group" aria-label={T.categoryPage.completedMode} className="flex items-center gap-1">
      {MODES.map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          aria-pressed={value === mode}
          className={`text-sm px-3 py-1 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
            value === mode
              ? 'bg-accent text-bg-main font-medium'
              : 'bg-bg-card text-text-secondary hover:text-text-main'
          }`}
        >
          {LABELS[mode]}
        </button>
      ))}
    </div>
  )
}
