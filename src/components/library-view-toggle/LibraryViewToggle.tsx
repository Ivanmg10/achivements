'use client'

import { IconLayoutRows, IconStack2 } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { LibraryView } from '@/hooks/useLibraryPrefs'
import SegmentedControl from '@/components/ui/SegmentedControl'

const OPTIONS = [
  { view: 'platform', icon: IconLayoutRows, label: 'byPlatform' },
  { view: 'all', icon: IconStack2, label: 'together' },
] as const

/** Platforms in their own sections, or every game in one list. */
export default function LibraryViewToggle({ value, onChange }: { value: LibraryView; onChange: (view: LibraryView) => void }) {
  const { T } = useLanguage()
  return (
    <SegmentedControl
      aria-label={T.libraryFilters.viewLabel}
      size="xs"
      value={value}
      onChange={onChange}
      options={OPTIONS.map(({ view, icon, label }) => ({ value: view, icon, label: T.libraryFilters[label], compact: true }))}
    />
  )
}
