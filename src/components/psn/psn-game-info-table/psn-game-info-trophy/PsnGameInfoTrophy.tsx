import { FadeImage } from '@/components/ui/FadeImage'
import { IconCheck, IconLock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import SteamPinAchievementButton from '@/components/steam/steam-pin-achievement-button/SteamPinAchievementButton'
import { formatRarity, formatUnlock } from '@/utils/steamFeed'
import { psnTrophyAnchor, TROPHY_GRADE_COLOR } from '@/utils/psnTitles'
import type { PsnTrophy, TrophyGrade } from '@/types/psn'

const GRADE_RING: Record<TrophyGrade, string> = {
  platinum: 'ring-sky-300',
  gold: 'ring-yellow-400',
  silver: 'ring-zinc-400',
  bronze: 'ring-orange-400',
}

/**
 * One trophy as a table row on the PSN game page, styled like
 * SteamGameInfoAchievement: 64px icon (ringed in its grade's colour once
 * earned), name, description, grade, rarity and when it was earned. Locked
 * ones are dimmed and say "Locked" in text too; hidden ones keep their secret
 * until earned.
 */
export default function PsnGameInfoTrophy({
  trophy: t,
  highlighted = false,
  pinned,
  onTogglePin,
}: {
  trophy: PsnTrophy
  highlighted?: boolean
  /** Undefined for a signed-out visitor, who cannot pin. */
  pinned?: boolean
  onTogglePin?: () => void
}) {
  const { T, lang } = useLanguage()
  const concealed = t.hidden && !t.earned
  const grade = { platinum: T.psn.platinum, gold: T.psn.gold, silver: T.psn.silver, bronze: T.psn.bronze }[t.type]

  return (
    <tr
      id={psnTrophyAnchor(t.id)}
      data-trophy={t.id}
      className={`border-b border-bg-header/60 transition-colors duration-500 scroll-mt-24 ${
        highlighted ? 'bg-[#0070d1]/15' : 'hover:bg-bg-header/30'
      }`}
    >
      <td className="px-3 py-2 w-24 align-middle text-center">
        {t.iconUrl && !concealed ? (
          <FadeImage
            src={t.iconUrl}
            alt=""
            width={64}
            height={64}
            className={`w-16 h-16 rounded-xl mx-auto ${t.earned ? `ring-2 ${GRADE_RING[t.type]}` : ''}`}
            imgClassName={`w-full h-full object-cover ${t.earned ? '' : 'grayscale opacity-50'}`}
            unoptimized
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-ink/10 mx-auto" aria-hidden="true" />
        )}
      </td>

      <td className={`px-3 py-2 ${t.earned ? '' : 'opacity-60'}`}>
        <h3 className="text-lg">{concealed ? T.psn.hiddenTrophy : t.name}</h3>
        <p className="text-sm text-text-secondary">{concealed ? T.psn.hiddenTrophyDesc : t.detail}</p>
      </td>

      <td className={`px-3 py-2 w-28 text-center text-sm font-semibold ${TROPHY_GRADE_COLOR[t.type]}`}>{grade}</td>

      <td className="px-3 py-2 w-28 text-center text-sm tabular-nums text-text-secondary">
        {t.rarity !== null ? `${formatRarity(t.rarity)}%` : '—'}
      </td>

      <td className="px-3 py-2 w-44 text-center text-xs">
        {t.earned ? (
          <span className="inline-flex items-center gap-1 text-[#4da3ff]">
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
          <SteamPinAchievementButton pinned={pinned} title={concealed ? T.psn.hiddenTrophy : t.name} onToggle={() => onTogglePin?.()} size={18} />
        </td>
      )}
    </tr>
  )
}
