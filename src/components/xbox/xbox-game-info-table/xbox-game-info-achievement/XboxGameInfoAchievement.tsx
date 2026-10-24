import { FadeImage } from '@/components/ui/FadeImage'
import { IconCheck, IconLock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import SteamPinAchievementButton from '@/components/steam/steam-pin-achievement-button/SteamPinAchievementButton'
import XboxRevealAchievementButton from '@/components/xbox/xbox-reveal-achievement-button/XboxRevealAchievementButton'
import { formatUnlock } from '@/utils/steamFeed'
import { xboxAchievementAnchor } from '@/utils/xboxTitles'
import type { XboxAchievement } from '@/types/xbox'
import RarityBadge from '@/components/ui/RarityBadge'

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
      className={`relative group/row border-b border-bg-header/60 transition-colors duration-500 scroll-mt-24 ${
        highlighted ? 'bg-accent/15' : pinned ? 'bg-warning/10 hover:bg-bg-header/30' : 'hover:bg-bg-header/30'
      }`}
    >
      <td className="px-3 py-2 w-24 align-middle text-center">
        <div className="relative w-16 h-16 mx-auto">
          {a.iconUrl && !concealed ? (
            <FadeImage
              src={a.iconUrl}
              alt=""
              width={64}
              height={64}
              className={`w-16 h-16 rounded-xl ${a.unlocked ? 'ring-2 ring-green-500' : ''}`}
              imgClassName={`w-full h-full object-cover ${a.unlocked ? '' : 'grayscale opacity-50'}`}
              unoptimized
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-ink/10" aria-hidden="true" />
          )}
          {a.secret && !a.unlocked && onToggleReveal && (
            <XboxRevealAchievementButton
              revealed={revealed}
              onToggle={onToggleReveal}
              size={22}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-bg-card/90 text-text-main flex items-center justify-center opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
            />
          )}
        </div>
      </td>

      <td className="px-3 py-2">
        <h3 className={`text-lg ${a.unlocked ? '' : 'text-text-secondary'}`}>
          <button
            type="button"
            onClick={onOpen}
            className="text-left rounded cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {concealed ? T.xbox.secretAchievement : a.name}
          </button>
        </h3>
        <p className="text-sm text-text-secondary">{concealed ? T.xbox.secretAchievementDesc : a.description}</p>
      </td>

      <td className="px-3 py-2 w-28 text-center text-sm font-semibold tabular-nums text-green-500">{a.gamerscore} G</td>

      <td className="px-3 py-2 w-28 text-center text-sm tabular-nums text-text-secondary">
        <RarityBadge pct={a.rarity} />
      </td>

      <td className="px-3 py-2 w-44 text-center text-xs">
        {a.unlocked ? (
          <span className="inline-flex items-center gap-1 text-success">
            <IconCheck size={14} aria-hidden="true" />
            {a.unlockedAt ? formatUnlock(a.unlockedAt, lang) : T.xbox.earned}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-text-secondary">
            <IconLock size={14} aria-hidden="true" />
            {T.xbox.locked}
          </span>
        )}
      </td>

      {pinned !== undefined && (
        <td className="px-3 py-2 w-12 text-center align-middle">
          <SteamPinAchievementButton pinned={pinned} title={concealed ? T.xbox.secretAchievement : a.name} onToggle={() => onTogglePin?.()} size={18} className="relative z-10" />
        </td>
      )}
    </tr>
  )
}
