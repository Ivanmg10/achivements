import { useLanguage } from '@/context/LanguageContext'
import ShowMore from '@/components/ui/ShowMore'

/** Under a capped list: shows the rest of it, or folds it back. */
export default function ShowAllButton({ total, expanded, onToggle }: { total: number; expanded: boolean; onToggle: () => void }) {
  const { T } = useLanguage()
  return (
    <ShowMore
      size="sm"
      expanded={expanded}
      onToggle={onToggle}
      more={T.statusGameItem.showAllAchievements.replace('{n}', String(total))}
      less={T.statusGameItem.showFewerAchievements}
      className="self-start mt-2"
    />
  )
}
