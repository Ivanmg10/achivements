'use client'

import { useMemo, useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { normalizeTitle } from '@/utils/gameCandidates'
import type { AdminUser } from '@/types/user'
import Button from '@/components/ui/Button'
import ErrorRetry from '@/components/ui/ErrorRetry'
import SearchInput from '@/components/ui/SearchInput'
import ShowMore from '@/components/ui/ShowMore'
import { scrollFadeClass } from '@/components/ui/scrollFade'
import AdminUsersTable from '../admin-users-table/AdminUsersTable'
import AdminUsersSkeleton from '../admin-users-skeleton/AdminUsersSkeleton'

/** How many sign-ups show before "See all". */
export const RECENT_USERS = 10

/**
 * The users tab. Its head holds the search and "New user" (in the tab, not stuck inside the scrolling body). With no
 * search it shows the 10 most recent sign-ups (the highest ids; the list carries no sign-up date) with a soft fade
 * and "See all (N)"; a search shows every match. Name, email, id or a linked account, whatever an admin has to hand.
 */
export default function AdminUsersTab({
  users,
  loading,
  error,
  currentAdminId,
  onRetry,
  onCreate,
  onEdit,
  onToggleAdmin,
  onDelete,
}: {
  users: AdminUser[]
  loading: boolean
  error: string | null
  currentAdminId: number
  onRetry: () => void
  onCreate: () => void
  onEdit: (user: AdminUser) => void
  onToggleAdmin: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
}) {
  const [query, setQuery] = useState('')
  const [all, setAll] = useState(false)
  const searching = query.trim() !== ''

  const matches = useMemo(() => {
    const q = normalizeTitle(query.trim())
    if (!q) return users
    return users.filter((u) =>
      [u.username, u.email, String(u.id), u.rausername, u.ra_display, u.steamusername, u.psnusername, u.xboxgamertag].some(
        (field) => field && normalizeTitle(field).includes(q),
      ),
    )
  }, [users, query])

  const newest = useMemo(() => [...users].sort((a, b) => b.id - a.id), [users])
  const capped = !searching && !all && newest.length > RECENT_USERS
  const shown = searching ? matches : capped ? newest.slice(0, RECENT_USERS) : newest

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users…"
          aria-label="Search users"
          className="w-full sm:w-72"
        />
        <Button size="sm" onClick={onCreate} className="ml-auto">
          <IconPlus size={14} aria-hidden="true" />
          New user
        </Button>
      </div>

      {loading ? (
        <AdminUsersSkeleton />
      ) : error ? (
        <ErrorRetry message={error} retryLabel="Retry" onRetry={onRetry} />
      ) : shown.length === 0 ? (
        <p className="py-12 text-center text-text-secondary text-sm">No users match that search</p>
      ) : (
        <>
          <div className={capped ? scrollFadeClass({ start: false, end: true }, 'y') : ''}>
            <AdminUsersTable users={shown} currentAdminId={currentAdminId} onEdit={onEdit} onToggleAdmin={onToggleAdmin} onDelete={onDelete} />
          </div>
          {!searching && newest.length > RECENT_USERS && (
            <ShowMore
              expanded={all}
              onToggle={() => setAll((a) => !a)}
              more={`See all (${newest.length})`}
              less={`Show the ${RECENT_USERS} most recent`}
              className="self-center"
            />
          )}
        </>
      )}
    </div>
  )
}
