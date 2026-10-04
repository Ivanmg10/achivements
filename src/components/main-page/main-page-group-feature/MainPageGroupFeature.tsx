'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconArrowRight, IconFolder } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useGroupDetail } from '@/hooks/useGroupDetail'
import type { GameGroup, GameGroupItem } from '@/types/types'
import GroupIcon from '@/components/groups/group-icon/GroupIcon'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import EmptyState from '@/components/empty-state/EmptyState'
import { GameRowSkeleton } from '@/components/ui/GameRowSkeleton'
import { plural } from '@/utils/utils'

/** Games listed before "N more": enough to see the group, short enough to scan. */
const SHOWN = 6

const itemHref = (i: GameGroupItem) => (i.source === 'steam' ? `/steamGame/${i.game_id}` : `/gameInfo/${i.game_id}`)

/**
 * The group shown in full: its icon, name and overall progress, and its
 * games as a list, each with its progress, in the order the user keeps them.
 */
export default function MainPageGroupFeature({ group }: { group: GameGroup }) {
  const { T, lang } = useLanguage()
  const { group: detail, isLoading, error } = useGroupDetail(group.id)
  const items = detail?.items ?? []
  const overall = group.total_possible > 0 ? Math.round((group.total_awarded / group.total_possible) * 100) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <GroupIcon group={group} />
        <div className="flex flex-col min-w-0 flex-1">
          <h3 className="text-lg font-bold tracking-tight truncate">
            <Link
              href={`/groups/${group.id}`}
              className="hover:underline underline-offset-2 decoration-text-main/40 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {group.title}
            </Link>
          </h3>
          <p className="text-xs text-text-secondary truncate">
            {plural(group.game_count, T.plurals.games, lang)}
            {group.total_possible > 0 && ` · ${group.total_awarded.toLocaleString()}/${group.total_possible.toLocaleString()}`}
          </p>
        </div>
        {overall !== null && <span className="text-2xl font-bold tabular-nums text-warning">{overall}%</span>}
      </div>
      {group.description && <p className="text-sm text-text-secondary -mt-2">{group.description}</p>}

      {isLoading ? (
        <div className="flex flex-col gap-1.5 animate-pulse motion-reduce:animate-none" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <GameRowSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-red-400">{T.cards.groupLoadFailed}</p>
      ) : items.length === 0 ? (
        <EmptyState icon={<IconFolder className="w-6 h-6" />} title={T.cards.groupEmpty} size="compact" />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.slice(0, SHOWN).map((item) => {
            const pct = Math.min(100, Math.round(parseFloat(item.pct_won) * 100))
            return (
              <li key={item.id}>
                <Link
                  href={itemHref(item)}
                  className="flex items-center gap-3 rounded-xl bg-bg-main p-2.5 hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 min-w-0"
                >
                  {item.source === 'steam' ? (
                    <SteamGameImage appId={item.game_id} asset="icon" iconUrl={item.image_icon ?? undefined} size={40} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : item.image_icon ? (
                    <Image src={`https://retroachievements.org${item.image_icon}`} alt="" width={40} height={40} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <span aria-hidden="true" className="w-10 h-10 rounded-lg bg-ink/10 shrink-0" />
                  )}
                  <span className="flex flex-col min-w-0 flex-1 gap-1">
                    <span className="text-sm font-semibold truncate">{item.title}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[11px] text-text-secondary truncate shrink-0 max-w-[45%]">
                        {item.source === 'steam' ? 'Steam' : item.console_name}
                      </span>
                      <span aria-hidden="true" className="h-1 flex-1 rounded-full bg-ink/[0.06] overflow-hidden">
                        <span
                          className={`block h-full rounded-full ${item.source === 'steam' ? 'bg-[#66c0f4]' : 'bg-warning'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                    </span>
                  </span>
                  <span className={`text-xs font-semibold tabular-nums shrink-0 ${pct >= 100 ? 'text-warning' : 'text-text-main'}`}>{pct}%</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <Link
        href={`/groups/${group.id}`}
        className="self-start flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-main transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        {items.length > SHOWN ? `${T.cards.viewGroup} (${T.cards.moreMatches.replace('{n}', String(items.length - SHOWN))})` : T.cards.viewGroup}
        <IconArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}
