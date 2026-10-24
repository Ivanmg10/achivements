import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { buttonClass } from '@/components/ui/Button'

/** Under a table that shows its first rows: "show the other N", then "show fewer". */
export default function ShowRestButton({ folded, rest, onToggle }: { folded: boolean; rest: number; onToggle: () => void }) {
  const { T } = useLanguage()
  return (
    <button type="button" onClick={onToggle} aria-expanded={!folded} className={buttonClass('secondary', 'md', 'self-center')}>
      {folded ? T.gameInfoTable.showRest.replace('{n}', String(rest)) : T.gameInfoTable.showLess}
      {folded ? <IconChevronDown className="w-4 h-4" aria-hidden="true" /> : <IconChevronUp className="w-4 h-4" aria-hidden="true" />}
    </button>
  )
}
