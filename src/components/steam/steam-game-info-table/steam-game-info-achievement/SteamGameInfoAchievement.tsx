import { FadeImage } from '@/components/ui/FadeImage'
import { IconCheck, IconLock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { formatUnlock } from '@/utils/steamFeed'
import SteamOnlineBadge from '@/components/steam/steam-online-badge/SteamOnlineBadge'
import SteamPinAchievementButton from '@/components/steam/steam-pin-achievement-button/SteamPinAchievementButton'
import type { SteamAchievementUnified } from '@/types/steam'
import RarityBadge from '@/components/ui/RarityBadge'

/**
 * One achievement as a table row on the Steam game page, styled like RA's
 * GameInfoAchivement: 64px badge, title, description, unlock date, rarity.
 * Locked ones have a grey badge and say "Locked" in text too, with their
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
    <tr
      data-ach={a.apiname}
      className={`relative border-b border-bg-header/60 transition-colors duration-500 ${
        highlighted ? 'bg-accent/15' : pinned ? 'bg-warning/10 hover:bg-bg-header/30' : 'hover:bg-bg-header/30'
      }`}
    >
      <td className="px-3 py-2 w-24 align-middle text-center">
        {a.badgeUrl ? (
          <FadeImage
            src={a.badgeUrl}
            alt=""
            width={64}
            height={64}
            className={`w-16 h-16 rounded-xl mx-auto ${a.earned ? 'ring-2 ring-accent' : ''}`}
            imgClassName={`w-full h-full object-cover ${a.earned ? '' : 'grayscale opacity-50'}`}
            unoptimized
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-ink/10 mx-auto" aria-hidden="true" />
        )}
      </td>

      <td className="px-3 py-2">
        <h3 className={`text-lg ${a.earned ? '' : 'text-text-secondary'}`}>
          <button
            type="button"
            onClick={onOpen}
            className="text-left rounded cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {concealed ? T.steam.hiddenAchievement : a.title}
          </button>
          {a.likelyOnline && <SteamOnlineBadge className="ml-2 align-middle" />}
        </h3>
        <p className="text-sm text-text-secondary">{concealed ? T.steam.hiddenAchievementDesc : a.description}</p>
      </td>

      <td className="px-3 py-2 w-32 text-center text-sm tabular-nums text-text-secondary">
        <RarityBadge pct={a.globalPct} />
      </td>

      <td className="px-3 py-2 w-44 text-center text-xs">
        {a.earned ? (
          <span className="inline-flex items-center gap-1 text-success">
            <IconCheck size={14} aria-hidden="true" />
            {a.dateEarned ? formatUnlock(a.dateEarned, lang) : T.steam.earned}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-text-secondary">
            <IconLock size={14} aria-hidden="true" />
            {T.steam.locked}
          </span>
        )}
      </td>

      {pinned !== undefined && (
        <td className="px-3 py-2 w-12 text-center align-middle">
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
