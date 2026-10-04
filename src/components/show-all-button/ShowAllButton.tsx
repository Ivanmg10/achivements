import { IconChevronDown } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/** Under a capped list: shows the rest of it, or folds it back. */
export default function ShowAllButton({ total, expanded, onToggle }: { total: number; expanded: boolean; onToggle: () => void }) {
  const { T } = useLanguage()
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="self-start mt-2 flex items-center gap-1.5 rounded-full border border-ink/10 bg-ink/5 px-3 py-1 text-xs font-medium text-text-secondary hover:text-text-main hover:bg-ink/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      {expanded ? T.statusGameItem.showFewerAchievements : T.statusGameItem.showAllAchievements.replace('{n}', String(total))}
      <IconChevronDown size={14} aria-hidden="true" className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
    </button>
  )
}
