import { IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import SearchInput from '@/components/ui/SearchInput'
import IconButton from '@/components/ui/IconButton'

/**
 * Filters a category page by title across every platform at once, so a game
 * is found without knowing which platform it is on. The library's search
 * field, with a button to empty it.
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
    <div className="relative w-full sm:w-[21.25rem]">
      <SearchInput
        id={id}
        size="md"
        aria-label={T.categoryPage.searchGames}
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={T.categoryPage.searchGames}
        className="w-full [&_input]:pr-10 [&_input::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <IconButton size="sm" aria-label={T.categoryPage.clearSearch} onClick={() => onChange('')} className="absolute right-1.5 top-1/2 -translate-y-1/2">
          <IconX className="w-4 h-4" aria-hidden="true" />
        </IconButton>
      )}
    </div>
  )
}
