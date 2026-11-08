import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { GameSource } from '@/types/game'
import Tag from '@/components/ui/Tag'

/**
 * The platform a game is from, with its logo and name. Small on a card; large
 * beside a game's name when it is the one open; a plain tag in a list row.
 */
export default function LibraryPlatformBadge({ source, size = 'sm' }: { source: GameSource; size?: 'sm' | 'lg' | 'tag' }) {
  if (size === 'tag') {
    return (
      <span className="inline-flex items-center h-[1.1875rem] px-1.5 rounded-badge text-[0.6875rem] font-bold whitespace-nowrap bg-ink/[0.07] text-text-secondary">
        {PLATFORM_NAME[source]}
      </span>
    )
  }
  const large = size === 'lg'
  return (
    <Tag tone={large ? 'overlay' : 'surface'} size={large ? 'md' : 'xs'}>
      <PlatformLogo source={source} size={large ? 18 : 11} />
      {PLATFORM_NAME[source]}
    </Tag>
  )
}
