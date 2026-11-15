'use client'

import { useLanguage } from '@/context/LanguageContext'
import { pillClass } from '@/components/ui/Pill'

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
          className={pillClass(value === mode)}
        >
          {LABELS[mode]}
        </button>
      ))}
    </div>
  )
}
