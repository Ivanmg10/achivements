import Image from 'next/image'
import { IconCheck, IconLock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import SteamPinAchievementButton from '@/components/steam/steam-pin-achievement-button/SteamPinAchievementButton'
import { formatRarity, formatUnlock } from '@/utils/steamFeed'
import { TROPHY_GRADE_COLOR } from '@/utils/psnTitles'
import type { PsnTrophy } from '@/types/psn'

/**
 * One trophy as a card, for the phone layout of the PSN game page — the
 * counterpart of SteamGameInfoAchievementCard. Carries no anchor id: the
 * table row does, and only one of the two is ever shown.
 */
export default function PsnGameInfoTrophyCard({
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
    <li
      data-trophy={t.id}
      className={`flex items-start gap-3 rounded-xl p-3 transition-colors duration-500 ${highlighted ? 'bg-[#0070d1]/15' : 'bg-bg-main/40'}`}
    >
      {t.iconUrl && !concealed ? (
        <Image
          src={t.iconUrl}
          alt=""
          width={48}
          height={48}
          className={`w-12 h-12 rounded-lg object-cover shrink-0 ${t.earned ? 'ring-2 ring-[#0070d1]' : 'grayscale opacity-50'}`}
          unoptimized
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-ink/10 shrink-0" aria-hidden="true" />
      )}

      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <h3 className={`text-sm font-semibold ${t.earned ? '' : 'text-text-secondary'}`}>{concealed ? T.psn.hiddenTrophy : t.name}</h3>
        <p className="text-xs text-text-secondary">{concealed ? T.psn.hiddenTrophyDesc : t.detail}</p>
        <div className="flex items-center gap-2 flex-wrap text-[11px] mt-1">
          <span className={`font-semibold ${TROPHY_GRADE_COLOR[t.type]}`}>{grade}</span>
          {t.earned ? (
            <span className="inline-flex items-center gap-1 text-[#4da3ff]">
              <IconCheck size={12} aria-hidden="true" />
              {t.earnedAt ? formatUnlock(t.earnedAt, lang) : T.psn.earned}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-text-secondary">
              <IconLock size={12} aria-hidden="true" />
              {T.psn.locked}
            </span>
          )}
          {t.rarity !== null && (
            <span className="text-text-secondary">
              {formatRarity(t.rarity)}
              {T.achievement.haveIt}
            </span>
          )}
        </div>
      </div>

      {pinned !== undefined && (
        <SteamPinAchievementButton
          pinned={pinned}
          title={concealed ? T.psn.hiddenTrophy : t.name}
          onToggle={() => onTogglePin?.()}
          className="shrink-0 mt-0.5"
        />
      )}
    </li>
  )
}
