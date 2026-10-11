import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'

/**
 * The platform a game is from, with its logo and name. Small on a card; large
 * beside a game's name when it is the one open.
 */
export default function LibraryPlatformBadge({ source, size = 'sm' }: { source: GameSource; size?: 'sm' | 'lg' }) {
  const large = size === 'lg'
  return (
    <span
      className={`inline-flex items-center font-semibold bg-bg-main text-text-main whitespace-nowrap ${
        large ? 'gap-2 text-xs px-3 py-1.5 rounded-xl ring-1 ring-ink/10' : 'gap-1.5 text-[10px] px-1.5 py-0.5 rounded-md'
      }`}
    >
      <PlatformLogo source={source} size={large ? 18 : 11} />
      {PLATFORM_NAME[source]}
    </span>
  )
}
