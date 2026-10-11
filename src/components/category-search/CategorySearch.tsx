import { IconSearch, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/**
 * Filters a category page by title across both platforms at once — the RA
 * list and the Steam section answer to this one box, so a game is found
 * without knowing which platform it is on.
 *
 * It is the page's way in to a long list, so it is a field you can see: long
 * and round like the one of the top bar, with its own outline. Where "/" jumps to it, the key is
 * shown inside while it is empty (`shortcut`).
 */
export default function CategorySearch({
  value,
  onChange,
  id = 'category-search',
  shortcut = false,
}: {
  value: string
  onChange: (value: string) => void
  /** Set when a page shows more than one search box. */
  id?: string
  /** The "/" key goes to this box on this page: say so. */
  shortcut?: boolean
}) {
  const { T } = useLanguage()
  return (
    <div className="flex items-center gap-2.5 bg-bg-card rounded-full pl-4 pr-3 py-1.5 ring-1 ring-ink/20 shadow-sm shadow-black/10 transition-shadow hover:ring-ink/35 focus-within:ring-2 focus-within:ring-accent w-full sm:w-96 lg:w-[30rem]">
      <IconSearch className="w-4 h-4 text-text-main/70 shrink-0" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">
        {T.categoryPage.searchGames}
      </label>
      <input
        id={id}
        type="search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`${T.categoryPage.searchGames}…`}
        className="flex-1 min-w-0 bg-transparent text-sm text-text-main outline-none placeholder:text-text-secondary [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value ? (
        <button
          onClick={() => onChange('')}
          aria-label={T.categoryPage.clearSearch}
          className="p-1 rounded text-text-secondary hover:text-text-main transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <IconX className="w-4 h-4" aria-hidden="true" />
        </button>
      ) : shortcut ? (
        <kbd aria-hidden="true" className="hidden sm:inline-flex items-center justify-center w-5 h-5 rounded-md ring-1 ring-ink/20 text-xs font-medium text-text-secondary shrink-0">
          /
        </kbd>
      ) : null}
    </div>
  )
}
