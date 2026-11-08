import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import type { GameSource } from '@/types/steam'

/**
 * The small round platform mark in a game tile's corner: its platform's logo
 * (Steam, PlayStation or Xbox). RA has none (its tiles mark hardcore instead),
 * so it renders nothing. Decorative — the tile says the platform in words.
 */
export default function PlatformMark({ source, size = 11 }: { source: GameSource; size?: number }) {
  if (source === 'ra') return null
  return (
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-1 rounded-full bg-bg-card flex items-center justify-center"
      style={{ width: size + 5, height: size + 5 }}
    >
      <PlatformLogo source={source} size={size} />
    </span>
  )
}
