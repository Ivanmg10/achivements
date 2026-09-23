import Image from 'next/image'
import Link from 'next/link'
import type { PinnedAchievement } from '@/types/types'
import RaLogo from '@/components/ra-logo/RaLogo'
import MainPageFavoritesUnpinButton from '../main-page-favorites-unpin-button/MainPageFavoritesUnpinButton'

type RaPin = Extract<PinnedAchievement, { source: 'ra' }>

/** A pinned RA achievement: opens its detail modal, links to its game, shows its points. */
export default function MainPageFavoritesRaRow({
  fav,
  onOpen,
  onUnpin,
}: {
  fav: RaPin
  onOpen: () => void
  onUnpin: () => void
}) {
  const earned = !!fav.snapshot.DateEarned
  return (
    <div className="group flex items-center gap-2 hover:bg-bg-main/60 rounded-lg px-2 py-1.5 transition-colors">
      <button onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        {fav.snapshot.BadgeName && (
          <Image
            src={`https://media.retroachievements.org/Badge/${fav.snapshot.BadgeName}.png`}
            alt={fav.snapshot.Title}
            width={36}
            height={36}
            className={`w-9 h-9 rounded-lg object-cover shrink-0 ${earned ? '' : 'grayscale opacity-50'}`}
          />
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-xs font-medium truncate">{fav.snapshot.Title}</p>
          <Link
            href={`/gameInfo/${fav.game_id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] text-text-secondary hover:text-text-main transition-colors w-fit max-w-full"
          >
            <RaLogo height={9} className="opacity-60" />
            <span className="truncate">{fav.game_title}</span>
          </Link>
        </div>
      </button>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p className="text-xs font-semibold tabular-nums">{fav.snapshot.Points}</p>
          <p className="text-[10px] text-text-secondary">pts</p>
        </div>
        <MainPageFavoritesUnpinButton onUnpin={onUnpin} />
      </div>
    </div>
  )
}
