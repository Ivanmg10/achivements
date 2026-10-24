import { FadeImage } from '@/components/ui/FadeImage'
import { IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import SteamPinAchievementButton from '@/components/steam/steam-pin-achievement-button/SteamPinAchievementButton'
import XboxRevealAchievementButton from '@/components/xbox/xbox-reveal-achievement-button/XboxRevealAchievementButton'
import { formatUnlock } from '@/utils/steamFeed'
import { xboxAchievementAnchor } from '@/utils/xboxTitles'
import type { XboxAchievement } from '@/types/xbox'
import RarityBadge from '@/components/ui/RarityBadge'
import { badgeClass, badgeImgClass, MID, NUM, ROW, TD, TD_FIRST } from '@/components/ui/dataTable'

/**
 * One achievement as a table row on the Xbox game page, styled like
 * PsnGameInfoTrophy: 64px icon (ringed green once earned), name, description,
 * gamerscore, rarity and when it was earned. Locked ones have a grey icon and
 * say "Locked" in text too; secret ones keep their secret until earned. The
 * name is the button that opens the achievement, stretched over the row; the
 * reveal eye and the pin sit above it.
 */
export default function XboxGameInfoAchievement({
  achievement: a,
  highlighted = false,
  revealed = false,
  onToggleReveal,
  pinned,
  onTogglePin,
  onOpen,
}: {
  achievement: XboxAchievement
  highlighted?: boolean
  /** The viewer chose to see secret achievements before earning them. */
  revealed?: boolean
  /** Present for a secret, unearned achievement: the eye that shows or hides it. */
  onToggleReveal?: () => void
  /** Undefined when the viewer cannot pin. */
  pinned?: boolean
  onTogglePin?: () => void
  onOpen?: () => void
}) {
  const { T, lang } = useLanguage()
  const concealed = a.secret && !a.unlocked && !revealed

  return (
    <tr
      id={xboxAchievementAnchor(a.id)}
      data-achievement={a.id}
      className={`${ROW} group/row scroll-mt-24 ${highlighted ? '[&>td]:bg-accent/15' : pinned ? '[&>td]:bg-accent/[0.05]' : ''}`}
    >
      <td className={`${TD_FIRST} w-16`}>
        <div className="relative w-[3.25rem] h-[3.25rem]">
          {a.iconUrl && !concealed ? (
            <FadeImage
              src={a.iconUrl}
              alt=""
              width={52}
              height={52}
              className={badgeClass(a.unlocked ? 'earned' : 'locked')}
              imgClassName={badgeImgClass(!a.unlocked)}
              unoptimized
            />
          ) : (
            <span className={`${badgeClass('locked')} bg-ink/10`} aria-hidden="true" />
          )}
          {a.secret && !a.unlocked && onToggleReveal && (
            <XboxRevealAchievementButton
              revealed={revealed}
              onToggle={onToggleReveal}
              size={20}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-bg-card/90 text-text-main flex items-center justify-center opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
            />
          )}
        </div>
      </td>

      <td className={TD}>
        <h3 className="text-[0.9375rem] font-bold">
          <button
            type="button"
            onClick={onOpen}
            className="text-left rounded cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {concealed ? T.xbox.secretAchievement : a.name}
          </button>
        </h3>
        <p className="mt-0.5 text-[0.8125rem] leading-normal text-text-secondary">{concealed ? T.xbox.secretAchievementDesc : a.description}</p>
        {a.unlocked && a.unlockedAt && <p className="mt-0.5 text-xs text-accent">{formatUnlock(a.unlockedAt, lang)}</p>}
      </td>

      <td className={`${TD} ${NUM} w-24`}>
        <span className="text-base font-extrabold">{a.gamerscore}</span> <span className="text-xs text-text-secondary">G</span>
      </td>

      <td className={`${TD} ${MID} w-28`}>
        <RarityBadge pct={a.rarity} />
      </td>

      <td className={`${TD} ${NUM} w-28`}>
        {a.unlocked ? (
          <IconCheck className="w-[1.125rem] h-[1.125rem] text-success inline-block" aria-label={T.xbox.earned} />
        ) : (
          <span className="text-text-secondary">
            <span className="sr-only">{T.xbox.locked}</span>—
          </span>
        )}
      </td>

      {pinned !== undefined && (
        <td className={`${TD} ${MID} w-12`}>
          <SteamPinAchievementButton pinned={pinned} title={concealed ? T.xbox.secretAchievement : a.name} onToggle={() => onTogglePin?.()} size={18} className="relative z-10" />
        </td>
      )}
    </tr>
  )
}
