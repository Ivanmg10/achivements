import Image from 'next/image'
import { IconCheck, IconLock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import SteamPinAchievementButton from '@/components/steam/steam-pin-achievement-button/SteamPinAchievementButton'
import XboxRevealAchievementButton from '@/components/xbox/xbox-reveal-achievement-button/XboxRevealAchievementButton'
import { formatRarity, formatUnlock } from '@/utils/steamFeed'
import type { XboxAchievement } from '@/types/xbox'

/**
 * One achievement as a card, for the phone layout of the Xbox game page — the
 * counterpart of PsnGameInfoTrophyCard. Carries no anchor id: the table row
 * does, and only one of the two is ever shown. The whole card opens the
 * achievement, through a button stretched over it; the eye and the pin sit above
 * that.
 */
export default function XboxGameInfoAchievementCard({
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
    <li
      data-achievement={a.id}
      className={`relative flex items-start gap-3 rounded-xl p-3 transition-colors duration-500 ${
        highlighted ? 'bg-accent/15' : pinned ? 'bg-warning/10' : 'bg-bg-main/40'
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={concealed ? T.xbox.secretAchievement : a.name}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      />
      <div className="relative shrink-0 pointer-events-none">
        {a.iconUrl && !concealed ? (
          <Image
            src={a.iconUrl}
            alt=""
            width={48}
            height={48}
            className={`w-12 h-12 rounded-lg object-cover ${a.unlocked ? 'ring-2 ring-success' : 'grayscale opacity-50'}`}
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-ink/10" aria-hidden="true" />
        )}
        {a.secret && !a.unlocked && onToggleReveal && (
          // No hover on a phone: the eye is always there.
          <XboxRevealAchievementButton
            revealed={revealed}
            onToggle={onToggleReveal}
            size={20}
            className="absolute z-10 pointer-events-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-bg-card/90 text-text-main flex items-center justify-center"
          />
        )}
      </div>

      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <h3 className={`text-sm font-semibold ${a.unlocked ? '' : 'text-text-secondary'}`}>{concealed ? T.xbox.secretAchievement : a.name}</h3>
        <p className="text-xs text-text-secondary">{concealed ? T.xbox.secretAchievementDesc : a.description}</p>
        <div className="flex items-center gap-2 flex-wrap text-[11px] mt-1">
          <span className="font-semibold text-success">{a.gamerscore} G</span>
          {a.unlocked ? (
            <span className="inline-flex items-center gap-1 text-success">
              <IconCheck size={12} aria-hidden="true" />
              {a.unlockedAt ? formatUnlock(a.unlockedAt, lang) : T.xbox.earned}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-text-secondary">
              <IconLock size={12} aria-hidden="true" />
              {T.xbox.locked}
            </span>
          )}
          {a.rarity !== null && (
            <span className="text-text-secondary">
              {formatRarity(a.rarity)}
              {T.achievement.haveIt}
            </span>
          )}
        </div>
      </div>

      {pinned !== undefined && (
        <SteamPinAchievementButton
          pinned={pinned}
          title={concealed ? T.xbox.secretAchievement : a.name}
          onToggle={() => onTogglePin?.()}
          className="relative z-10 shrink-0 mt-0.5"
        />
      )}
    </li>
  )
}
