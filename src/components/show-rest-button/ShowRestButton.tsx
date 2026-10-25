import { useLanguage } from '@/context/LanguageContext'
import ShowMore from '@/components/ui/ShowMore'

/** Under a table that shows its first rows: "show the other N", then "show fewer". */
export default function ShowRestButton({ folded, rest, onToggle }: { folded: boolean; rest: number; onToggle: () => void }) {
  const { T } = useLanguage()
  return <ShowMore expanded={!folded} onToggle={onToggle} more={T.gameInfoTable.showRest.replace('{n}', String(rest))} less={T.gameInfoTable.showLess} className="self-center" />
}
