'use client'

import { IconLayoutRows, IconStack2 } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { LibraryView } from '@/hooks/useLibraryPrefs'

const OPTIONS = [
  { view: 'platform', icon: IconLayoutRows, label: 'byPlatform' },
  { view: 'all', icon: IconStack2, label: 'together' },
] as const

/** Platforms in their own sections, or every game in one list. */
export default function LibraryViewToggle({ value, onChange }: { value: LibraryView; onChange: (view: LibraryView) => void }) {
  const { T } = useLanguage()
  return (
    <div role="group" aria-label={T.libraryFilters.viewLabel} className="flex items-center gap-0.5 bg-bg-card rounded-lg p-0.5">
      {OPTIONS.map(({ view, icon: Icon, label }) => {
        const active = value === view
        return (
          <button
            key={view}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(view)}
            className={`flex items-center gap-1.5 h-7 px-2 rounded-md text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
              active ? 'bg-bg-main text-accent ring-1 ring-ink/10 font-medium' : 'text-text-secondary hover:text-text-main'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{T.libraryFilters[label]}</span>
          </button>
        )
      })}
    </div>
  )
}
