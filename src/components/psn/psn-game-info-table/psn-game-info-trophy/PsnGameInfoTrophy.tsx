import { FadeImage } from '@/components/ui/FadeImage'
import { IconCheck, IconLock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import SteamPinAchievementButton from '@/components/steam/steam-pin-achievement-button/SteamPinAchievementButton'
import PsnRevealTrophyButton from '@/components/psn/psn-reveal-trophy-button/PsnRevealTrophyButton'
import { formatRarity, formatUnlock } from '@/utils/steamFeed'
import { psnTrophyAnchor, TROPHY_GRADE_COLOR, TROPHY_GRADE_RING } from '@/utils/psnTitles'
import type { PsnTrophy } from '@/types/psn'

/**
 * One trophy as a table row on the PSN game page, styled like
 * SteamGameInfoAchievement: 64px icon (ringed in its grade's colour once
 * earned), name, description, grade, rarity and when it was earned. Locked
 * ones have a grey icon and say "Locked" in text too, with their text kept
 * at full contrast; hidden ones keep their secret until earned. The name is
 * the button that opens the trophy, stretched over the row; the reveal eye
 * and the pin sit above it.
 */
export default function PsnGameInfoTrophy({
  trophy: t,
  highlighted = false,
  revealed = false,
  onToggleReveal,
  pinned,
  onTogglePin,
  onOpen,
}: {
  trophy: PsnTrophy
  highlighted?: boolean
  /** The viewer chose to see hidden trophies before earning them. */
  revealed?: boolean
  /** Present for a hidden, unearned trophy: the eye that shows or hides it. */
  onToggleReveal?: () => void
  /** Undefined for a signed-out visitor, who cannot pin. */
  pinned?: boolean
  onTogglePin?: () => void
  onOpen?: () => void
}) {
  const { T, lang } = useLanguage()
  const concealed = t.hidden && !t.earned && !revealed
  const grade = { platinum: T.psn.platinum, gold: T.psn.gold, silver: T.psn.silver, bronze: T.psn.bronze }[t.type]

  return (
    <tr
      id={psnTrophyAnchor(t.id)}
      data-trophy={t.id}
      className={`relative group/row border-b border-bg-header/60 transition-colors duration-500 scroll-mt-24 ${
        highlighted ? 'bg-accent/15' : pinned ? 'bg-warning/10 hover:bg-bg-header/30' : 'hover:bg-bg-header/30'
      }`}
    >
      <td className="px-3 py-2 w-24 align-middle text-center">
        <div className="relative w-16 h-16 mx-auto">
        {t.iconUrl && !concealed ? (
          <FadeImage
            src={t.iconUrl}
            alt=""
            width={64}
            height={64}
            className={`w-16 h-16 rounded-xl ${t.earned ? `ring-2 ${TROPHY_GRADE_RING[t.type]}` : ''}`}
            imgClassName={`w-full h-full object-cover ${t.earned ? '' : 'grayscale opacity-50'}`}
            unoptimized
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-ink/10" aria-hidden="true" />
        )}
        {t.hidden && !t.earned && onToggleReveal && (
          <PsnRevealTrophyButton
            revealed={revealed}
            onToggle={onToggleReveal}
            size={22}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-bg-card/90 text-text-main flex items-center justify-center opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
          />
        )}
        </div>
      </td>

      <td className="px-3 py-2">
        <h3 className={`text-lg ${t.earned ? '' : 'text-text-secondary'}`}>
          <button
            type="button"
            onClick={onOpen}
            className="text-left rounded cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {concealed ? T.psn.hiddenTrophy : t.name}
          </button>
        </h3>
        <p className="text-sm text-text-secondary">{concealed ? T.psn.hiddenTrophyDesc : t.detail}</p>
      </td>

      <td className={`px-3 py-2 w-28 text-center text-sm font-semibold ${TROPHY_GRADE_COLOR[t.type]}`}>{grade}</td>

      <td className="px-3 py-2 w-28 text-center text-sm tabular-nums text-text-secondary">
        {t.rarity !== null ? `${formatRarity(t.rarity)}%` : '—'}
      </td>

      <td className="px-3 py-2 w-44 text-center text-xs">
        {t.earned ? (
          <span className="inline-flex items-center gap-1 text-success">
            <IconCheck size={14} aria-hidden="true" />
            {t.earnedAt ? formatUnlock(t.earnedAt, lang) : T.psn.earned}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-text-secondary">
            <IconLock size={14} aria-hidden="true" />
            {T.psn.locked}
          </span>
        )}
      </td>

      {pinned !== undefined && (
        <td className="px-3 py-2 w-12 text-center align-middle">
          <SteamPinAchievementButton pinned={pinned} title={concealed ? T.psn.hiddenTrophy : t.name} onToggle={() => onTogglePin?.()} size={18} className="relative z-10" />
        </td>
      )}
    </tr>
  )
}
