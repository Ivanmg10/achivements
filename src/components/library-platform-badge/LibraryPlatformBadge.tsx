import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'

/**
 * The platform a game is from, with its logo and name. Small on a card; large
 * beside a game's name when it is the one open; a plain tag in a list row.
 */
export default function LibraryPlatformBadge({ source, size = 'sm' }: { source: GameSource; size?: 'sm' | 'lg' | 'tag' }) {
  if (size === 'tag') {
    return (
      <span className="inline-flex items-center h-[1.1875rem] px-1.5 rounded-[0.3125rem] text-[0.6875rem] font-bold whitespace-nowrap bg-ink/[0.07] text-text-secondary">
        {PLATFORM_NAME[source]}
      </span>
    )
  }
  const large = size === 'lg'
  return (
    <span
      className={`inline-flex items-center font-semibold bg-bg-main text-text-main whitespace-nowrap ${
        large ? 'gap-1.5 h-[1.375rem] px-2 rounded-tag text-xs font-bold bg-black/45' : 'gap-1.5 text-[10px] px-1.5 py-0.5 rounded-tag'
      }`}
    >
      <PlatformLogo source={source} size={large ? 18 : 11} />
      {PLATFORM_NAME[source]}
    </span>
  )
}
