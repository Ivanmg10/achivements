'use client'

import { useLanguage } from '@/context/LanguageContext'
import SegmentedControl from '@/components/ui/SegmentedControl'

export type LibraryLayout = 'list' | 'cards'

const OPTIONS = [
  { layout: 'list', label: 'listLabel' },
  { layout: 'cards', label: 'cardsLabel' },
] as const

/** The two ways to read a status list: a list with the detail beside it, or cards. */
export default function LibraryLayoutToggle({ value, onChange }: { value: LibraryLayout; onChange: (layout: LibraryLayout) => void }) {
  const { T } = useLanguage()
  return (
    <SegmentedControl
      aria-label={T.libraryLayout.layoutLabel}
      size="md"
      value={value}
      onChange={onChange}
      options={OPTIONS.map(({ layout, label }) => ({ value: layout, label: T.libraryLayout[label] }))}
    />
  )
}
