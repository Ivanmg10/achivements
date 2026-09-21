import Image from 'next/image'
import { IconCheck, IconLock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { formatRarity, formatUnlock } from '@/utils/steamFeed'
import type { SteamAchievementUnified } from '@/types/steam'

/**
 * One achievement as a card, for the phone layout of the Steam game page —
 * the counterpart of RA's GameInfoAchievementCard.
 */
export default function SteamGameInfoAchievementCard({
  achievement: a,
  highlighted = false,
}: {
  achievement: SteamAchievementUnified
  highlighted?: boolean
}) {
  const { T, lang } = useLanguage()
  const concealed = a.hidden && !a.earned

  return (
    <li
      data-ach={a.apiname}
      className={`flex items-start gap-3 rounded-xl p-3 transition-colors duration-500 ${
        highlighted ? 'bg-[#66c0f4]/15' : 'bg-bg-main/40'
      }`}
    >
      {a.badgeUrl ? (
        <Image
          src={a.badgeUrl}
          alt=""
          width={48}
          height={48}
          className={`w-12 h-12 rounded-lg object-cover shrink-0 ${a.earned ? 'ring-2 ring-[#66c0f4]' : 'grayscale opacity-50'}`}
          unoptimized
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-white/10 shrink-0" aria-hidden="true" />
      )}

      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <h3 className={`text-sm font-semibold ${a.earned ? '' : 'text-text-secondary'}`}>
          {concealed ? T.steam.hiddenAchievement : a.title}
        </h3>
        <p className="text-xs text-text-secondary">{concealed ? T.steam.hiddenAchievementDesc : a.description}</p>
        <div className="flex items-center gap-2 flex-wrap text-[11px] mt-1">
          {a.earned ? (
            <span className="inline-flex items-center gap-1 text-[#66c0f4]">
              <IconCheck size={12} aria-hidden="true" />
              {a.dateEarned ? formatUnlock(a.dateEarned, lang) : T.steam.earned}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-text-secondary/60">
              <IconLock size={12} aria-hidden="true" />
              {T.steam.locked}
            </span>
          )}
          {a.globalPct !== null && (
            <span className="text-text-secondary/60">
              {formatRarity(a.globalPct)}
              {T.achievement.haveIt}
            </span>
          )}
        </div>
      </div>
    </li>
  )
}
