import Link from 'next/link'
import { IconLock, IconWorld } from '@tabler/icons-react'
import { GameGroup } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { relativeTime, plural } from '@/utils/utils'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import GroupCoverMosaic from '@/components/groups/group-cover-mosaic/GroupCoverMosaic'
import GroupProgressBar from '@/components/groups/group-progress-bar/GroupProgressBar'

/**
 * A group in the list: its covers, name and privacy, how many games and from
 * which platforms, how far along it is, and when it last changed. The whole
 * card opens the group.
 */
export default function GroupCard({ group }: { group: GameGroup }) {
  const { T, lang } = useLanguage()
  const psnCount = group.psn_count ?? 0
  const raCount = group.game_count - group.steam_count - psnCount
  const isMixed = [raCount, group.steam_count, psnCount].filter((n) => n > 0).length > 1
  const Privacy = group.is_public ? IconWorld : IconLock

  return (
    <Link
      href={`/groups/${group.id}`}
      className="spotlight flex items-center gap-4 h-full bg-bg-card rounded-2xl p-3 ring-1 ring-ink/5 hover:ring-ink/15 hover:bg-ink/[0.03] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <GroupCoverMosaic group={group} />
      <div className="flex flex-col min-w-0 flex-1 gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold truncate group-hover:text-accent transition-colors">{group.title}</span>
          <Privacy className={`w-3.5 h-3.5 shrink-0 ${group.is_public ? 'text-accent' : 'text-text-secondary'}`} aria-hidden="true" />
          <span className="sr-only">{group.is_public ? T.groups.public : T.groups.private}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="shrink-0">
            {plural(group.game_count, T.plurals.games, lang)}
          </span>
          {isMixed && (
            <span className="flex items-center gap-1.5 shrink-0" role="img" aria-label={T.groups.mixedPlatforms}>
              {raCount > 0 && <RaLogo height={11} className="opacity-70" />}
              {group.steam_count > 0 && <SteamLogo size={11} className="text-[#66c0f4]/80" />}
              {psnCount > 0 && <PlaystationLogo size={11} className="text-[#0070d1]" />}
            </span>
          )}
        </div>

        <GroupProgressBar earned={group.total_awarded} total={group.total_possible} label={group.title} />

        <p className="text-xs text-text-secondary truncate">
          {group.total_possible > 0 && (
            <>
              {T.groups.achievementsCount.replace('{earned}', String(group.total_awarded)).replace('{total}', String(group.total_possible))}
              {' · '}
            </>
          )}
          {T.groups.updatedAgo.replace('{when}', relativeTime(group.updated_at, lang))}
        </p>
      </div>
    </Link>
  )
}
