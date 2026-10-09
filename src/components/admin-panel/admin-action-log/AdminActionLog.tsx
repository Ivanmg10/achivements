import { useState } from 'react'
import { IconChevronDown, IconHistory } from '@tabler/icons-react'
import { adminFetch } from '@/utils/adminFetch'

type Entry = {
  id: number
  admin_username: string
  target_username: string | null
  action: string
  detail: Record<string, unknown> | null
  created_at: string
}

const LABELS: Record<string, string> = {
  unlock: 'unlocked the panel',
  'create-user': 'created',
  'update-user': 'edited',
  'delete-user': 'deleted',
  'link-ra': 'linked RA for',
  'unlink-ra': 'unlinked RA from',
  'link-steam': 'linked Steam for',
  'unlink-steam': 'unlinked Steam from',
  'psn-token': 'renewed the PSN token',
}

/** What changed, in a few words: the field for an edit, the account for a link. */
function describe(entry: Entry): string | null {
  const d = entry.detail
  if (!d) return null
  if (entry.action === 'update-user') return `${d.field}: ${d.from ?? '—'} → ${d.to ?? '—'}`
  if (entry.action === 'link-ra') return String(d.rausername ?? '')
  if (entry.action === 'link-steam') return String(d.steamusername ?? d.steamid ?? '')
  if (entry.action === 'psn-token' && typeof d.expiresAt === 'string') return `valid until ${d.expiresAt.slice(0, 10)}`
  return null
}

/** The last admin actions, loaded when opened: who did what, to whom, when. */
export default function AdminActionLog() {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (!next) return
    setError(null)
    try {
      const res = await adminFetch('/api/admin/actions')
      if (!res.ok) throw new Error(`actions ${res.status}`)
      setEntries(await res.json())
    } catch {
      setError('Could not load the action log')
    }
  }

  return (
    <section className="bg-bg-card rounded-2xl">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded-2xl"
      >
        <IconHistory size={16} className="text-accent" aria-hidden="true" />
        <span className="flex-1">Action log</span>
        <IconChevronDown size={16} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4">
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          {!error && entries === null && <p className="text-sm text-text-secondary">Loading…</p>}
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
        </div>
      )}
    </section>
  )
}
