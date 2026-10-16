import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import type { PinnedAchievement } from '@/types/types'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { gameHref } from '@/utils/gameRef'
import { xboxAchievementAnchor } from '@/utils/xboxTitles'
import MainPageFavoritesUnpinButton from '../main-page-favorites-unpin-button/MainPageFavoritesUnpinButton'
import { useSubject } from '@/context/SubjectContext'

type XboxPin = Extract<PinnedAchievement, { source: 'xbox' }>

/**
 * A pinned Xbox achievement, like the PSN row: links straight to it on the game
 * page, says its gamerscore, and shows its rarity where RA rows show points.
 */
export default function MainPageFavoritesXboxRow({ fav, onUnpin }: { fav: XboxPin; onUnpin?: () => void }) {
  const { T } = useLanguage()
  const subject = useSubject()
  const a = fav.snapshot
  const name = a.secret && !a.unlocked ? T.xbox.secretAchievement : a.name

  return (
    <div className="group flex items-center gap-2 hover:bg-bg-main/60 rounded-lg px-2 py-1.5 transition-colors">
      <Link
        href={`${gameHref('xbox', fav.game_id, subject)}#${xboxAchievementAnchor(fav.xbox_achievement_id)}`}
        className="flex items-center gap-3 flex-1 min-w-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        {a.iconUrl ? (
          <Image
            src={a.iconUrl}
            alt=""
            width={36}
            height={36}
            className={`w-9 h-9 rounded-lg object-cover shrink-0 ${a.unlocked ? '' : 'grayscale opacity-50'}`}
            unoptimized
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-ink/10 shrink-0" aria-hidden="true" />
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-xs font-medium truncate">{name}</p>
          <p className="flex items-center gap-1 text-[10px] text-text-secondary min-w-0">
            <XboxLogo size={10} className="text-green-500 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {fav.game_title} · <span className="text-green-500">{a.gamerscore} G</span> · {a.unlocked ? T.xbox.earned : T.xbox.locked}
            </span>
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        {a.rarity !== null && a.rarity !== undefined && (
          <p className="text-[10px] text-text-secondary tabular-nums">
            {a.rarity.toFixed(1)}
            {T.achievement.haveIt}
          </p>
        )}
        {onUnpin && <MainPageFavoritesUnpinButton onUnpin={onUnpin} />}
      </div>
    </div>
  )
}
