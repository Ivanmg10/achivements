import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import ToggleButton from '@/components/ui/ToggleButton'

/**
 * Pins a Steam achievement to the main page's pinned card, or unpins it: the
 * library's toggle button, which reports its state and fills the star when pinned.
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
  return (
    <ToggleButton
      pressed={pinned}
      onToggle={onToggle}
      label={`${pinned ? T.favorites.removeFavorite : T.favorites.addFavorite}: ${title}`}
      icon={IconStar}
      pressedIcon={IconStarFilled}
      size={size}
      className={className}
    />
  )
}
