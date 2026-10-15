import Image from 'next/image'
import { IconCheck, IconLock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { formatRarity, formatUnlock } from '@/utils/steamFeed'
import SteamOnlineBadge from '@/components/steam/steam-online-badge/SteamOnlineBadge'
import SteamPinAchievementButton from '@/components/steam/steam-pin-achievement-button/SteamPinAchievementButton'
import type { SteamAchievementUnified } from '@/types/steam'

/**
 * One achievement as a card, for the phone layout of the Steam game page —
 * the counterpart of RA's GameInfoAchievementCard. The whole card opens the
 * achievement, through a button stretched over it; the pin sits above that.
 */
export default function SteamGameInfoAchievementCard({
  achievement: a,
  highlighted = false,
  pinned,
  onTogglePin,
  onOpen,
}: {
  achievement: SteamAchievementUnified
  highlighted?: boolean
  /** Undefined for a signed-out visitor, who cannot pin. */
  pinned?: boolean
  onTogglePin?: () => void
  onOpen?: () => void
}) {
  const { T, lang } = useLanguage()
  const concealed = a.hidden && !a.earned

  return (
    <li
      data-ach={a.apiname}
      className={`relative flex items-start gap-3 rounded-xl p-3 transition-colors duration-500 ${
        highlighted ? 'bg-accent/15' : pinned ? 'bg-warning/10' : 'bg-bg-main/40'
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={concealed ? T.steam.hiddenAchievement : a.title}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      />
      {a.badgeUrl ? (
        <Image
          src={a.badgeUrl}
          alt=""
          width={48}
          height={48}
          className={`w-12 h-12 rounded-lg object-cover shrink-0 ${a.earned ? 'ring-2 ring-accent' : 'grayscale opacity-50'}`}
          unoptimized
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-ink/10 shrink-0" aria-hidden="true" />
      )}

      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <h3 className={`text-sm font-semibold ${a.earned ? '' : 'text-text-secondary'}`}>
          {concealed ? T.steam.hiddenAchievement : a.title}
        </h3>
        <p className="text-xs text-text-secondary">{concealed ? T.steam.hiddenAchievementDesc : a.description}</p>
        <div className="flex items-center gap-2 flex-wrap text-[11px] mt-1">
          {a.earned ? (
            <span className="inline-flex items-center gap-1 text-success">
              <IconCheck size={12} aria-hidden="true" />
              {a.dateEarned ? formatUnlock(a.dateEarned, lang) : T.steam.earned}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-text-secondary">
              <IconLock size={12} aria-hidden="true" />
              {T.steam.locked}
            </span>
          )}
          {a.globalPct !== null && (
            <span className="text-text-secondary">
              {formatRarity(a.globalPct)}
              {T.achievement.haveIt}
            </span>
          )}
          {a.likelyOnline && <SteamOnlineBadge />}
        </div>
      </div>

      {pinned !== undefined && (
        <SteamPinAchievementButton
          pinned={pinned}
          title={concealed ? T.steam.hiddenAchievement : a.title}
          onToggle={() => onTogglePin?.()}
          className="relative z-10 shrink-0 mt-0.5"
        />
      )}
    </li>
  )
}
