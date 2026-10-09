import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import type { PinnedAchievement } from '@/types/types'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { gameHref } from '@/utils/gameRef'
import { psnTrophyAnchor, TROPHY_GRADE_COLOR } from '@/utils/psnTitles'
import MainPageFavoritesUnpinButton from '../main-page-favorites-unpin-button/MainPageFavoritesUnpinButton'

type PsnPin = Extract<PinnedAchievement, { source: 'psn' }>

/**
 * A pinned PSN trophy, like the Steam row: links straight to it on the game
 * page, says its grade, and shows its rarity where RA rows show points.
 */
export default function MainPageFavoritesPsnRow({ fav, onUnpin }: { fav: PsnPin; onUnpin: () => void }) {
  const { T } = useLanguage()
  const t = fav.snapshot
  const name = t.hidden && !t.earned ? T.psn.hiddenTrophy : t.name
  const grade = { platinum: T.psn.platinum, gold: T.psn.gold, silver: T.psn.silver, bronze: T.psn.bronze }[t.type]

  return (
    <div className="group flex items-center gap-2 hover:bg-bg-main/60 rounded-lg px-2 py-1.5 transition-colors">
      <Link
        href={`${gameHref('psn', fav.game_id)}#${psnTrophyAnchor(fav.psn_trophy_id)}`}
        className="flex items-center gap-3 flex-1 min-w-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        {t.iconUrl ? (
          <Image
            src={t.iconUrl}
            alt=""
            width={36}
            height={36}
            className={`w-9 h-9 rounded-lg object-cover shrink-0 ${t.earned ? '' : 'grayscale opacity-50'}`}
            unoptimized
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-ink/10 shrink-0" aria-hidden="true" />
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-xs font-medium truncate">{name}</p>
          <p className="flex items-center gap-1 text-[10px] text-text-secondary min-w-0">
            <PlaystationLogo size={10} className="text-[#0070d1] shrink-0" aria-hidden="true" />
            <span className="truncate">
              {fav.game_title} · <span className={TROPHY_GRADE_COLOR[t.type]}>{grade}</span> · {t.earned ? T.psn.earned : T.psn.locked}
            </span>
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        {t.rarity !== null && t.rarity !== undefined && (
          <p className="text-[10px] text-text-secondary tabular-nums">
            {t.rarity.toFixed(1)}
            {T.achievement.haveIt}
          </p>
        )}
        <MainPageFavoritesUnpinButton onUnpin={onUnpin} />
      </div>
    </div>
  )
}
