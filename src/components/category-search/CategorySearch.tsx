import { IconSearch, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/**
 * Filters a category page by title across both platforms at once — the RA
 * list and the Steam section answer to this one box, so a game is found
 * without knowing which platform it is on.
 */
export default function CategorySearch({
  value,
  onChange,
  id = 'category-search',
}: {
  value: string
  onChange: (value: string) => void
  /** Set when a page shows more than one search box. */
  id?: string
}) {
  const { T } = useLanguage()
  return (
    <div className="flex items-center gap-2 bg-bg-card rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-accent/70 w-full sm:w-64">
      <IconSearch className="w-4 h-4 text-text-secondary shrink-0" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">
        {T.categoryPage.searchGames}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={T.categoryPage.searchGames}
        className="flex-1 min-w-0 bg-transparent text-sm text-text-main outline-none placeholder:text-text-secondary/70"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label={T.categoryPage.clearSearch}
          className="p-0.5 rounded text-text-secondary hover:text-text-main transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <IconX className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
