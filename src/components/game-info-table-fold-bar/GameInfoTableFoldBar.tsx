import { IconChevronDown } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/**
 * The bar over a game's achievement table that folds it to its first rows or
 * opens it again, with how many the filter shows out of all of them. Shared
 * by the RA, Steam and PSN tables.
 */
export default function GameInfoTableFoldBar({
  expanded,
  onToggle,
  shown,
  total,
}: {
  expanded: boolean
  onToggle: () => void
  /** Rows the current filter leaves. */
  shown: number
  total: number
}) {
  const { T } = useLanguage()

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-bg-header/40 hover:bg-bg-header/60 backdrop-blur-sm border border-ink/5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-text-main">
        <span className={`inline-block transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
          <IconChevronDown className="w-4 h-4 text-accent" aria-hidden="true" />
        </span>
        {expanded ? T.gameInfoTable.collapseTable : `${T.gameInfoTable.expandTable} (${shown})`}
      </span>
      <span className="text-xs text-text-secondary bg-bg-main/30 px-2 py-0.5 rounded-full tabular-nums">
        {shown} / {total}
      </span>
    </button>
  )
}
