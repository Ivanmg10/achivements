import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/**
 * Pins a Steam achievement to the main page's pinned card, or unpins it.
 * A switch rather than a button: it reports its state, and the filled star
 * says "pinned" by shape as well as by colour.
 */
export default function SteamPinAchievementButton({
  pinned,
  title,
  onToggle,
  size = 16,
  className = '',
}: {
  pinned: boolean
  /** The achievement's name, for the accessible label. */
  title: string
  onToggle: () => void
  size?: number
  className?: string
}) {
  const { T } = useLanguage()
  const label = `${pinned ? T.favorites.removeFavorite : T.favorites.addFavorite}: ${title}`
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pinned}
      aria-label={label}
      title={label}
      onClick={onToggle}
      className={`transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded ${
        pinned ? 'text-yellow-400 hover:text-yellow-300' : 'text-text-secondary/50 hover:text-yellow-400'
      } ${className}`}
    >
      {pinned ? (
        <IconStarFilled style={{ width: size, height: size }} aria-hidden="true" />
      ) : (
        <IconStar style={{ width: size, height: size }} aria-hidden="true" />
      )}
    </button>
  )
}
