'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { UserSearchResult } from '@/hooks/useUserSearch'
import type { RecentUser } from '@/hooks/useRecentUsers'
import UserSummary from '@/components/user-summary/UserSummary'
import SearchModalGroup from '../search-modal-group/SearchModalGroup'
import { SEARCH_ROW } from '../search-modal-row/SearchModalRow'
import { Skeleton } from '@/components/ui/Skeleton'

/**
 * The people found by the search, a group of the panel: each with picture,
 * presence, country, a line of their bio and the platforms they play on.
 * Nothing until three letters are typed; while looking, shapes; a failed
 * request and no match say so.
 */
export default function SearchModalUserResults({
  users,
  onSelect,
}: {
  users: { results: UserSearchResult[]; isLoading: boolean; error: boolean; active: boolean }
  onSelect: (user: RecentUser) => void
}) {
  const { T } = useLanguage()
  if (!users.active) return null

  const title = users.isLoading || users.error ? T.search.people : `${T.search.people} · ${users.results.length}`

  return (
    <SearchModalGroup title={title}>
      {users.isLoading ? (
        <div aria-busy="true" className="flex flex-col">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3 px-2.5 py-2">
              <Skeleton radius="circle" className="w-10 h-10 shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-3.5 w-32 max-w-full" />
                <Skeleton className="h-2.5 w-48 max-w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : users.error ? (
        <p role="alert" className="text-danger text-sm px-2 py-3">{T.publicProfile.userLoadError}</p>
      ) : users.results.length === 0 ? (
        <p className="text-text-secondary text-sm px-2 py-3">{T.publicProfile.noUserFound}</p>
      ) : (
        <ul aria-label={T.userSearch.resultsLabel}>
          {users.results.map((u) => (
            <li key={u.username}>
              <button type="button" data-search-option className={SEARCH_ROW} onClick={() => onSelect(u)}>
                <UserSummary user={u} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SearchModalGroup>
  )
}
