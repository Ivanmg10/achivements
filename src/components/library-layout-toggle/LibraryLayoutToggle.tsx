'use client'

import { IconLayoutGrid, IconList } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import SegmentedControl from '@/components/ui/SegmentedControl'

export type LibraryLayout = 'list' | 'cards'

const OPTIONS = [
  { layout: 'list', label: 'listLabel', icon: IconList },
  { layout: 'cards', label: 'cardsLabel', icon: IconLayoutGrid },
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
      // On a phone only the icons, so the order and the views share a row (#169); the names stay for a screen reader.
      options={OPTIONS.map(({ layout, label, icon }) => ({ value: layout, label: T.libraryLayout[label], icon, compact: true }))}
    />
  )
}
