import { FadeImage } from '@/components/ui/FadeImage'
import { IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import SteamPinAchievementButton from '@/components/steam/steam-pin-achievement-button/SteamPinAchievementButton'
import PsnRevealTrophyButton from '@/components/psn/psn-reveal-trophy-button/PsnRevealTrophyButton'
import { formatUnlock } from '@/utils/steamFeed'
import { psnTrophyAnchor, TROPHY_GRADE_COLOR, TROPHY_GRADE_RING } from '@/utils/psnTitles'
import type { PsnTrophy } from '@/types/psn'
import RarityBadge from '@/components/ui/RarityBadge'
import { badgeClass, badgeImgClass, MID, NUM, ROW, TD, TD_FIRST } from '@/components/ui/dataTable'

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
      className={`${ROW} group/row scroll-mt-24 ${highlighted ? '[&>td]:bg-accent/15' : pinned ? '[&>td]:bg-accent/[0.05]' : ''}`}
    >
      <td className={`${TD_FIRST} w-16`}>
        <div className="relative w-[3.25rem] h-[3.25rem]">
          {t.iconUrl && !concealed ? (
            <FadeImage
              src={t.iconUrl}
              alt=""
              width={52}
              height={52}
              className={`${badgeClass('locked')} ${t.earned ? `ring-2 ring-offset-2 ring-offset-bg-card ${TROPHY_GRADE_RING[t.type]}` : ''}`}
              imgClassName={badgeImgClass(!t.earned)}
              unoptimized
            />
          ) : (
            <span className={`${badgeClass('locked')} bg-ink/10`} aria-hidden="true" />
          )}
          {t.hidden && !t.earned && onToggleReveal && (
            <PsnRevealTrophyButton
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
            {concealed ? T.psn.hiddenTrophy : t.name}
          </button>
        </h3>
        <p className="mt-0.5 text-[0.8125rem] leading-normal text-text-secondary">{concealed ? T.psn.hiddenTrophyDesc : t.detail}</p>
        {t.earned && t.earnedAt && <p className="mt-0.5 text-xs text-accent">{formatUnlock(t.earnedAt, lang)}</p>}
      </td>

      <td className={`${TD} ${MID} w-24 font-bold ${TROPHY_GRADE_COLOR[t.type]}`}>{grade}</td>

      <td className={`${TD} ${MID} w-28`}>
        <RarityBadge pct={t.rarity} />
      </td>

      <td className={`${TD} ${NUM} w-28`}>
        {t.earned ? (
          <IconCheck className="w-[1.125rem] h-[1.125rem] text-success inline-block" aria-label={T.psn.earned} />
        ) : (
          <span className="text-text-secondary">
            <span className="sr-only">{T.psn.locked}</span>—
          </span>
        )}
      </td>

      {pinned !== undefined && (
        <td className={`${TD} ${MID} w-12`}>
          <SteamPinAchievementButton pinned={pinned} title={concealed ? T.psn.hiddenTrophy : t.name} onToggle={() => onTogglePin?.()} size={18} className="relative z-10" />
        </td>
      )}
    </tr>
  )
}
