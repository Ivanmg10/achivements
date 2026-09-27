import { IconStarFilled } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/** The filled star that unpins a row in the main page's pinned card. */
export default function MainPageFavoritesUnpinButton({ onUnpin }: { onUnpin: () => void }) {
  const { T } = useLanguage()
  return (
    <button
      onClick={onUnpin}
      aria-label={T.favorites.removeFavorite}
      title={T.favorites.removeFavorite}
      className="text-yellow-400 hover:text-yellow-300 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <IconStarFilled className="w-4 h-4" aria-hidden="true" />
    </button>
  )
}
