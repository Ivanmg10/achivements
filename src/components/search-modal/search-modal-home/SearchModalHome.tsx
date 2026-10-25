import { IconFlame, IconTrophy, IconUser } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useRecentFeed } from '@/hooks/useRecentFeed'
import { useStreakData } from '@/hooks/useStreakData'
import { useVaultMe } from '@/hooks/useVaultMe'
import type { RecentUser } from '@/hooks/useRecentUsers'
import { homeHeroOf } from '@/utils/homeHero'
import { gameHref } from '@/utils/gameRef'
import { plural, relativeTime } from '@/utils/utils'
import { pillClass } from '@/components/ui/Pill'
import SearchModalGroup from '../search-modal-group/SearchModalGroup'
import SearchModalRow from '../search-modal-row/SearchModalRow'

const SHOWN_GAMES = 2

/**
 * The search panel before anything is typed (the agreed design): the games
 * played last to go back to, the searches made lately as chips, the profiles
 * opened lately, and two places to go (the rankings with your place, your
 * streak).
 */
export default function SearchModalHome({
  recentSearches,
  onPickSearch,
  onClearSearches,
  recentUsers,
  onPickUser,
  onGo,
}: {
  recentSearches: string[]
  onPickSearch: (query: string) => void
  onClearSearches: () => void
  recentUsers: RecentUser[]
  onPickUser: (user: RecentUser) => void
  onGo: (href: string) => void
}) {
  const { T, lang } = useLanguage()
  const { feed } = useRecentFeed(SHOWN_GAMES)
  const { activeStreak } = useStreakData()
  const { me } = useVaultMe()
  const games = feed.map(homeHeroOf).filter((g): g is NonNullable<typeof g> => g !== null).slice(0, SHOWN_GAMES)

  return (
    <>
      {games.length > 0 && (
        <SearchModalGroup title={T.search.continuePlaying}>
          <ul>
            {games.map((g) => (
              <li key={`${g.source}:${g.id}`}>
                <SearchModalRow
                  media={g.icon ? <img src={g.icon} alt="" className="w-full h-full object-cover" /> : null}
                  title={g.title}
                  sub={[g.console, g.total > 0 ? `${g.earned} / ${g.total}` : null, g.lastPlayed ? relativeTime(g.lastPlayed, lang) : null].filter(Boolean).join(' · ')}
                  onSelect={() => onGo(gameHref(g.source, g.id))}
                />
              </li>
            ))}
          </ul>
        </SearchModalGroup>
      )}

      {recentSearches.length > 0 && (
        <SearchModalGroup
          title={T.search.recentSearches}
          aside={
            <button type="button" onClick={onClearSearches} className="text-xs text-text-secondary hover:text-text-main rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
              {T.search.clearRecent}
            </button>
          }
        >
          <div className="flex flex-wrap gap-1.5 px-2 pb-1.5">
            {recentSearches.map((q) => (
              <button key={q} type="button" data-search-option onClick={() => onPickSearch(q)} className={pillClass(false)}>
                {q}
              </button>
            ))}
          </div>
        </SearchModalGroup>
      )}

      {recentUsers.length > 0 && (
        <SearchModalGroup title={T.userSearch.recent}>
          <ul>
            {recentUsers.map((u) => (
              <li key={u.username}>
                <SearchModalRow
                  media={u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover rounded-full" /> : <IconUser className="w-4 h-4 text-text-secondary" aria-hidden="true" />}
                  title={u.username}
                  onSelect={() => onPickUser(u)}
                />
              </li>
            ))}
          </ul>
        </SearchModalGroup>
      )}

      <SearchModalGroup title={T.search.goTo}>
        <ul>
          <li>
            <SearchModalRow
              media={<IconTrophy className="w-[1.125rem] h-[1.125rem] text-text-main" aria-hidden="true" />}
              title={T.rankings.title}
              right={me && me.rank > 0 ? <span className="text-[0.8125rem] text-text-secondary shrink-0">{T.search.yourRank.replace('{n}', me.rank.toLocaleString(lang))}</span> : null}
              onSelect={() => onGo('/rankings')}
            />
          </li>
          <li>
            <SearchModalRow
              media={<IconFlame className="w-[1.125rem] h-[1.125rem] text-text-main" aria-hidden="true" />}
              title={T.streak.title}
              right={<span className="text-[0.8125rem] text-text-secondary shrink-0">{plural(activeStreak?.days ?? 0, T.plurals.days, lang)}</span>}
              onSelect={() => onGo('/racha')}
            />
          </li>
        </ul>
      </SearchModalGroup>
    </>
  )
}
