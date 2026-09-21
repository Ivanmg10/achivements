import Image from 'next/image'
import { IconCheck, IconLock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { formatRarity, formatUnlock } from '@/utils/steamFeed'
import type { SteamAchievementUnified } from '@/types/steam'

/**
 * One achievement as a table row on the Steam game page, styled like RA's
 * GameInfoAchivement: 64px badge, title, description, unlock date, rarity.
 * Locked ones are dimmed with a grey badge, and say "Locked" in text too.
 */
export default function SteamGameInfoAchievement({
  achievement: a,
  highlighted = false,
}: {
  achievement: SteamAchievementUnified
  /** Set when the page was opened on this achievement's link. */
  highlighted?: boolean
}) {
  const { T, lang } = useLanguage()
  // Steam keeps the text of secret achievements hidden until they are unlocked.
  const concealed = a.hidden && !a.earned

  return (
    <tr
      data-ach={a.apiname}
      className={`border-b border-bg-header/60 transition-colors duration-500 ${
        highlighted ? 'bg-[#66c0f4]/15' : 'hover:bg-bg-header/30'
      }`}
    >
      <td className="px-3 py-2 w-24 align-middle text-center">
        {a.badgeUrl ? (
          <Image
            src={a.badgeUrl}
            alt=""
            width={64}
            height={64}
            className={`w-16 h-16 rounded-xl object-cover block mx-auto ${
              a.earned ? 'ring-2 ring-[#66c0f4]' : 'grayscale opacity-50'
            }`}
            unoptimized
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-white/10 mx-auto" aria-hidden="true" />
        )}
      </td>

      <td className={`px-3 py-2 ${a.earned ? '' : 'opacity-60'}`}>
        <h3 className="text-lg">{concealed ? T.steam.hiddenAchievement : a.title}</h3>
        <p className="text-sm text-text-secondary">{concealed ? T.steam.hiddenAchievementDesc : a.description}</p>
      </td>

      <td className="px-3 py-2 w-32 text-center text-sm tabular-nums text-text-secondary">
        {a.globalPct !== null ? `${formatRarity(a.globalPct)}%` : '—'}
      </td>

      <td className="px-3 py-2 w-44 text-center text-xs">
        {a.earned ? (
          <span className="inline-flex items-center gap-1 text-[#66c0f4]">
            <IconCheck size={14} aria-hidden="true" />
            {a.dateEarned ? formatUnlock(a.dateEarned, lang) : T.steam.earned}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-text-secondary/60">
            <IconLock size={14} aria-hidden="true" />
            {T.steam.locked}
          </span>
        )}
      </td>
    </tr>
  )
}
