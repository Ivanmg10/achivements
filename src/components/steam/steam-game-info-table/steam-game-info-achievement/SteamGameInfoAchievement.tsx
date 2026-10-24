import { FadeImage } from '@/components/ui/FadeImage'
import { IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { formatUnlock } from '@/utils/steamFeed'
import SteamOnlineBadge from '@/components/steam/steam-online-badge/SteamOnlineBadge'
import SteamPinAchievementButton from '@/components/steam/steam-pin-achievement-button/SteamPinAchievementButton'
import type { SteamAchievementUnified } from '@/types/steam'
import RarityBadge from '@/components/ui/RarityBadge'
import { badgeClass, badgeImgClass, MID, NUM, ROW, TD, TD_FIRST } from '@/components/ui/dataTable'

/**
 * One achievement as a table row on the Steam game page, styled like RA's
 * GameInfoAchivement: 52px badge, title, description, unlock date, rarity.
 * Locked ones have a grey badge and say "Locked" to a screen reader too, with their
 * text kept at full contrast. The title is the button that opens the
 * achievement, stretched over the row; the pin sits above it.
 */
export default function SteamGameInfoAchievement({
  achievement: a,
  highlighted = false,
  pinned,
  onTogglePin,
  onOpen,
}: {
  achievement: SteamAchievementUnified
  /** Set when the page was opened on this achievement's link. */
  highlighted?: boolean
  /** Undefined for a signed-out visitor, who cannot pin. */
  pinned?: boolean
  onTogglePin?: () => void
  onOpen?: () => void
}) {
  const { T, lang } = useLanguage()
  // Steam keeps the text of secret achievements hidden until they are unlocked.
  const concealed = a.hidden && !a.earned

  return (
    <tr data-ach={a.apiname} className={`${ROW} ${highlighted ? '[&>td]:bg-accent/15' : pinned ? '[&>td]:bg-accent/[0.05]' : ''}`}>
      <td className={`${TD_FIRST} w-16`}>
        {a.badgeUrl ? (
          <FadeImage
            src={a.badgeUrl}
            alt=""
            width={52}
            height={52}
            className={badgeClass(a.earned ? 'earned' : 'locked')}
            imgClassName={badgeImgClass(!a.earned)}
            unoptimized
          />
        ) : (
          <span className={`${badgeClass('locked')} bg-ink/10`} aria-hidden="true" />
        )}
      </td>

      <td className={TD}>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[0.9375rem] font-bold">
            <button
              type="button"
              onClick={onOpen}
              className="text-left rounded cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {concealed ? T.steam.hiddenAchievement : a.title}
            </button>
          </h3>
          {a.likelyOnline && <SteamOnlineBadge />}
        </div>
        <p className="mt-0.5 text-[0.8125rem] leading-normal text-text-secondary">{concealed ? T.steam.hiddenAchievementDesc : a.description}</p>
        {a.earned && a.dateEarned && <p className="mt-0.5 text-xs text-accent">{formatUnlock(a.dateEarned, lang)}</p>}
      </td>

      <td className={`${TD} ${MID} w-28`}>
        <RarityBadge pct={a.globalPct} />
      </td>

      <td className={`${TD} ${NUM} w-28`}>
        {a.earned ? (
          <IconCheck className="w-[1.125rem] h-[1.125rem] text-success inline-block" aria-label={T.steam.earned} />
        ) : (
          <span className="text-text-secondary">
            <span className="sr-only">{T.steam.locked}</span>—
          </span>
        )}
      </td>

      {pinned !== undefined && (
        <td className={`${TD} ${MID} w-12`}>
          <SteamPinAchievementButton
            pinned={pinned}
            title={concealed ? T.steam.hiddenAchievement : a.title}
            onToggle={() => onTogglePin?.()}
            size={18}
            className="relative z-10"
          />
        </td>
      )}
    </tr>
  )
}
