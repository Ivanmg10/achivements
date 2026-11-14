'use client'

import { IconHistory } from '@tabler/icons-react'
import { useAdminActionLog, type AdminActionEntry as Entry } from '@/hooks/useAdminActionLog'
import ErrorRetry from '@/components/ui/ErrorRetry'
import { Skeleton } from '@/components/ui/Skeleton'

const LABELS: Record<string, string> = {
  unlock: 'unlocked the panel',
  'create-user': 'created',
  'update-user': 'edited',
  'delete-user': 'deleted',
  'list-users': 'listed all users',
  'unlock-failed': 'failed to unlock the panel',
  'totp-enrolled': 'set up the authenticator',
  'xbox-achievements': 'read Xbox achievements',
  'link-ra': 'linked RA for',
  'unlink-ra': 'unlinked RA from',
  'link-steam': 'linked Steam for',
  'unlink-steam': 'unlinked Steam from',
  'link-psn': 'linked PSN for',
  'unlink-psn': 'unlinked PSN from',
  'link-xbox': 'linked Xbox for',
  'unlink-xbox': 'unlinked Xbox from',
  'psn-token': 'renewed the PSN token',
  'xbox-lookup': 'looked up Xbox gamertag',
  'ranking-flag': 'reviewed a flagged game of',
}

/** What changed, in a few words: the field for an edit, the account for a link. */
function describe(entry: Entry): string | null {
  const d = entry.detail
  if (!d) return null
  if (entry.action === 'update-user') return `${d.field}: ${d.from ?? '—'} → ${d.to ?? '—'}`
  if (entry.action === 'link-ra') return String(d.rausername ?? '')
  if (entry.action === 'link-steam') return String(d.steamusername ?? d.steamid ?? '')
  if (entry.action === 'link-psn') return String(d.psnusername ?? d.psnaccountid ?? '')
  if (entry.action === 'link-xbox') return String(d.xboxgamertag ?? d.xboxxuid ?? '')
  if (entry.action === 'xbox-lookup') return String(d.gamertag ?? '')
  if (entry.action === 'ranking-flag') return `${d.title ?? d.gameId} → ${d.flag === 'cleared' ? 'counts' : 'kept out'}`
  if (entry.action === 'psn-token' && typeof d.expiresAt === 'string') return `valid until ${d.expiresAt.slice(0, 10)}`
  return null
}

/** The log tab: the last admin actions, who did what, to whom, when. */
export default function AdminActionLog() {
  const { entries, error, retry } = useAdminActionLog()

  return (
    <section aria-labelledby="admin-log-title" className="flex flex-col gap-3">
      <h3 id="admin-log-title" className="flex items-center gap-2 text-sm font-semibold">
        <IconHistory size={16} className="text-accent" aria-hidden="true" />
        Action log
      </h3>
      {error && <ErrorRetry message="Could not load the action log" retryLabel="Retry" onRetry={retry} />}
      {!error && entries === null && (
        <div role="status" aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Loading…</span>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-4 w-32 shrink-0" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      )}
      {entries?.length === 0 && <p className="text-sm text-text-secondary">Nothing yet.</p>}
      {entries && entries.length > 0 && (
        <ol className="flex flex-col divide-y divide-ink/5 text-sm">
          {entries.map((entry) => {
            const what = describe(entry)
            return (
              <li key={entry.id} className="py-2 flex flex-col sm:flex-row sm:items-baseline gap-x-3">
                <time dateTime={entry.created_at} className="text-xs text-text-secondary shrink-0 tabular-nums">
                  {new Date(entry.created_at).toLocaleString()}
                </time>
                <span className="min-w-0 break-words">
                  <strong>{entry.admin_username}</strong> {LABELS[entry.action] ?? entry.action}
                  {entry.target_username && <> <strong>{entry.target_username}</strong></>}
                  {what && <span className="text-text-secondary"> — {what}</span>}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
