'use client'

import Link from 'next/link'
import { IconUsers } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useFollowing } from '@/hooks/useFollowing'
import UserSummary from '@/components/user-summary/UserSummary'
import EmptyState from '@/components/empty-state/EmptyState'
import FollowingPageSkeleton from './following-page-skeleton/FollowingPageSkeleton'

/**
 * The people you follow, newest first: who they are on CheevoVault, each
 * opening their profile. Nothing is asked of RA, Steam or PSN here.
 */
export default function FollowingPage() {
  const { T, lang } = useLanguage()
  const { users, isLoading, error, retry } = useFollowing()

  return (
    <div className="flex flex-col items-center py-6 px-4">
      <section aria-labelledby="following-title" className="w-full max-w-3xl flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h1 id="following-title" className="text-2xl font-bold">{T.following.title}</h1>
          {!isLoading && !error && users.length > 0 && (
            <span className="text-sm text-text-secondary tabular-nums">{users.length.toLocaleString(lang)}</span>
          )}
        </div>

        <div className="bg-bg-card rounded-2xl p-2">
          {isLoading ? (
            <FollowingPageSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <p role="alert" className="text-sm text-red-400">{T.following.loadError}</p>
              <button onClick={retry} className="text-sm text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
                {T.publicProfile.retry}
              </button>
            </div>
          ) : users.length === 0 ? (
            <EmptyState icon={<IconUsers className="w-6 h-6" />} title={T.following.emptyTitle} subtitle={T.following.empty} className="py-12" />
          ) : (
            <ul className="flex flex-col gap-1">
              {users.map((u) => (
                <li key={u.username}>
                  <Link
                    href={`/user/${encodeURIComponent(u.username)}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-bg-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    <UserSummary user={u} size={40} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
