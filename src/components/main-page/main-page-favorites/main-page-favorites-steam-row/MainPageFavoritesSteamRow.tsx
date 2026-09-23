import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { achievementAnchor } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import type { PinnedAchievement } from '@/types/types'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import MainPageFavoritesUnpinButton from '../main-page-favorites-unpin-button/MainPageFavoritesUnpinButton'

type SteamPin = Extract<PinnedAchievement, { source: 'steam' }>

/**
 * A pinned Steam achievement: links straight to it on the game page (Steam
 * has no detail modal, as in its badge grid) and shows its global rarity
 * where RA rows show points — Steam has no points.
 */
export default function MainPageFavoritesSteamRow({ fav, onUnpin }: { fav: SteamPin; onUnpin: () => void }) {
  const { T } = useLanguage()
  const a = fav.snapshot
  const title = a.hidden && !a.earned ? T.steam.hiddenAchievement : a.title
  return (
    <div className="group flex items-center gap-2 hover:bg-bg-main/60 rounded-lg px-2 py-1.5 transition-colors">
      <Link
        href={`/steamGame/${fav.game_id}#${achievementAnchor(fav.steam_apiname)}`}
        className="flex items-center gap-3 flex-1 min-w-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        {a.badgeUrl ? (
          <Image
            src={a.badgeUrl}
            alt=""
            width={36}
            height={36}
            className={`w-9 h-9 rounded-lg object-cover shrink-0 ${a.earned ? '' : 'grayscale opacity-50'}`}
            unoptimized
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0" aria-hidden="true" />
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-xs font-medium truncate">{title}</p>
          <p className="flex items-center gap-1 text-[10px] text-text-secondary min-w-0">
            <SteamLogo size={10} className="text-[#66c0f4]" />
            <span className="truncate">{fav.game_title} · {a.earned ? T.steam.earned : T.steam.locked}</span>
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        {a.globalPct !== null && a.globalPct !== undefined && (
          <p className="text-[10px] text-text-secondary tabular-nums">
            {a.globalPct.toFixed(1)}
            {T.achievement.haveIt}
          </p>
        )}
        <MainPageFavoritesUnpinButton onUnpin={onUnpin} />
      </div>
    </div>
  )
}
