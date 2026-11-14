import { IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/** The row a pasted RetroAchievements id or link turns into: "Open game by id #1234", a toggle like the games are. */
export default function GamePickerIdRow({ id, selected, onToggle }: { id: number; selected: boolean; onToggle: () => void }) {
  const { T } = useLanguage()
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-tile ring-1 transition-colors text-left focus-ring ${selected ? 'ring-accent bg-accent/10' : 'ring-ink/10 hover:bg-bg-main'}`}
    >
      <span aria-hidden="true" className="w-10 h-10 rounded-box bg-bg-main flex items-center justify-center shrink-0 text-xs font-bold text-text-secondary">ID</span>
      <span className="flex-1 min-w-0 text-sm font-medium text-text-main">
        {T.search.openById} #{id}
      </span>
      {selected && <IconCheck className="w-4 h-4 text-accent" aria-hidden="true" />}
    </button>
  )
}
